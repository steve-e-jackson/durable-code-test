"""DynamoDB client for contribution storage.

Purpose: Lightweight DynamoDB client for storing contributions without a full database.
Scope: DynamoDB table operations for contribution management
Overview: This module provides a simple DynamoDB client that stores contributions
    in AWS DynamoDB, which is essentially free for small applications and requires
    no database management. It handles all CRUD operations for contributions with
    automatic ID generation and proper error handling.
Dependencies: boto3 for AWS SDK, environment variables for configuration
Exports: DynamoDBClient class with methods for contribution operations
Interfaces: Async methods for DynamoDB operations
Implementation: Uses aioboto3 for async AWS operations with proper error handling
"""

import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import aioboto3
from boto3.dynamodb.conditions import Attr, Key
from loguru import logger

from ..core.exceptions import ResourceNotFoundError, ServiceError


class DynamoDBClient:
    """Client for DynamoDB operations on contributions table."""

    def __init__(self):
        """Initialize DynamoDB client with configuration."""
        self.table_name = os.getenv("DYNAMODB_TABLE_NAME", "contributions")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.use_local = os.getenv("DYNAMODB_LOCAL", "false").lower() == "true"

        # For local development, we can use DynamoDB Local or just mock
        if self.use_local:
            # In-memory storage for local development
            self._local_storage: Dict[str, dict] = {}
            logger.info("Using local in-memory storage for development")
        else:
            self.session = aioboto3.Session()

    async def create_table_if_not_exists(self):
        """Create DynamoDB table if it doesn't exist."""
        if self.use_local:
            return  # No need for local storage

        try:
            async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                # Check if table exists
                existing_tables = await dynamodb.tables.all()
                table_names = [table.name async for table in existing_tables]

                if self.table_name not in table_names:
                    # Create table
                    await dynamodb.create_table(
                        TableName=self.table_name,
                        KeySchema=[
                            {"AttributeName": "id", "KeyType": "HASH"},
                        ],
                        AttributeDefinitions=[
                            {"AttributeName": "id", "AttributeType": "S"},
                            {"AttributeName": "status", "AttributeType": "S"},
                            {"AttributeName": "submitted_at", "AttributeType": "S"},
                        ],
                        GlobalSecondaryIndexes=[
                            {
                                "IndexName": "status-index",
                                "KeySchema": [
                                    {"AttributeName": "status", "KeyType": "HASH"},
                                    {"AttributeName": "submitted_at", "KeyType": "RANGE"},
                                ],
                                "Projection": {"ProjectionType": "ALL"},
                                "BillingMode": "PAY_PER_REQUEST",
                            }
                        ],
                        BillingMode="PAY_PER_REQUEST",  # On-demand pricing
                    )
                    logger.info(f"Created DynamoDB table: {self.table_name}")
        except Exception as e:
            logger.error(f"Error creating DynamoDB table: {e}")
            # Table might already exist, continue

    async def put_contribution(self, contribution: dict) -> dict:
        """Store a contribution in DynamoDB.

        Args:
            contribution: Contribution data dictionary

        Returns:
            Stored contribution with generated ID

        Raises:
            ServiceError: If storage fails
        """
        try:
            # Generate unique ID if not provided
            if "id" not in contribution:
                contribution["id"] = str(uuid.uuid4())

            # Add timestamps
            if "submitted_at" not in contribution:
                contribution["submitted_at"] = datetime.utcnow().isoformat()
            contribution["updated_at"] = datetime.utcnow().isoformat()

            if self.use_local:
                # Local storage
                self._local_storage[contribution["id"]] = contribution
                return contribution

            # DynamoDB storage
            async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)
                await table.put_item(Item=contribution)
                return contribution

        except Exception as e:
            logger.error(f"Failed to store contribution: {e}")
            raise ServiceError(f"Failed to store contribution: {str(e)}")

    async def get_contribution(self, contribution_id: str) -> Optional[dict]:
        """Get a contribution by ID.

        Args:
            contribution_id: The contribution ID

        Returns:
            Contribution data or None if not found
        """
        try:
            if self.use_local:
                return self._local_storage.get(contribution_id)

            async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)
                response = await table.get_item(Key={"id": contribution_id})
                return response.get("Item")

        except Exception as e:
            logger.error(f"Failed to get contribution: {e}")
            return None

    async def update_contribution(self, contribution_id: str, updates: dict) -> dict:
        """Update a contribution.

        Args:
            contribution_id: The contribution ID
            updates: Dictionary of fields to update

        Returns:
            Updated contribution

        Raises:
            ResourceNotFoundError: If contribution not found
        """
        try:
            # Add update timestamp
            updates["updated_at"] = datetime.utcnow().isoformat()

            if self.use_local:
                if contribution_id not in self._local_storage:
                    raise ResourceNotFoundError(f"Contribution {contribution_id} not found")
                self._local_storage[contribution_id].update(updates)
                return self._local_storage[contribution_id]

            # Build update expression
            update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
            expr_names = {f"#{k}": k for k in updates.keys()}
            expr_values = {f":{k}": v for k, v in updates.items()}

            async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)
                response = await table.update_item(
                    Key={"id": contribution_id},
                    UpdateExpression=update_expr,
                    ExpressionAttributeNames=expr_names,
                    ExpressionAttributeValues=expr_values,
                    ReturnValues="ALL_NEW",
                )
                return response["Attributes"]

        except Exception as e:
            logger.error(f"Failed to update contribution: {e}")
            raise ServiceError(f"Failed to update contribution: {str(e)}")

    async def list_contributions(
        self,
        status: Optional[str] = None,
        limit: int = 20,
        last_evaluated_key: Optional[dict] = None,
    ) -> tuple[List[dict], Optional[dict]]:
        """List contributions with optional filtering.

        Args:
            status: Filter by status
            limit: Maximum number of results
            last_evaluated_key: Pagination key

        Returns:
            Tuple of (contributions list, next pagination key)
        """
        try:
            if self.use_local:
                # Local filtering
                results = list(self._local_storage.values())
                if status:
                    results = [c for c in results if c.get("status") == status]
                # Simple pagination
                start = 0
                if last_evaluated_key:
                    start = last_evaluated_key.get("offset", 0)
                end = start + limit
                next_key = {"offset": end} if end < len(results) else None
                return results[start:end], next_key

            # DynamoDB query
            async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)

                kwargs = {"Limit": limit}
                if last_evaluated_key:
                    kwargs["ExclusiveStartKey"] = last_evaluated_key

                if status:
                    # Use GSI for status filtering
                    kwargs["IndexName"] = "status-index"
                    kwargs["KeyConditionExpression"] = Key("status").eq(status)
                    response = await table.query(**kwargs)
                else:
                    # Scan all items
                    response = await table.scan(**kwargs)

                items = response.get("Items", [])
                next_key = response.get("LastEvaluatedKey")
                return items, next_key

        except Exception as e:
            logger.error(f"Failed to list contributions: {e}")
            return [], None

    async def get_statistics(self) -> dict:
        """Get contribution statistics.

        Returns:
            Dictionary with statistics
        """
        try:
            if self.use_local:
                all_items = list(self._local_storage.values())
            else:
                # For stats, we need to scan all items (not ideal for large datasets)
                async with self.session.resource("dynamodb", region_name=self.region) as dynamodb:
                    table = await dynamodb.Table(self.table_name)
                    response = await table.scan()
                    all_items = response.get("Items", [])

            # Calculate statistics
            total = len(all_items)
            status_counts = {}
            category_counts = {}

            for item in all_items:
                status = item.get("status", "unknown")
                status_counts[status] = status_counts.get(status, 0) + 1

                category = item.get("category", "other")
                category_counts[category] = category_counts.get(category, 0) + 1

            return {
                "total_submissions": total,
                "pending_review": status_counts.get("pending", 0),
                "approved": status_counts.get("approved", 0),
                "rejected": status_counts.get("rejected", 0),
                "spam": status_counts.get("spam", 0),
                "top_categories": [
                    {"category": k, "count": v}
                    for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                ],
            }

        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return {}
