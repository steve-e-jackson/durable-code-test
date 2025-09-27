# Purpose: Configure DNS delegation from parent domain to subdomain hosted zones
# Scope: NS record creation in parent domain for proper subdomain delegation
# Overview: This file automates the DNS delegation process when using subdomains by creating
#     NS records in the parent domain that point to the subdomain's hosted zone name servers.
#     This delegation is critical for DNS resolution and ACM certificate validation to function
#     properly. The configuration automatically detects the parent domain, locates its hosted
#     zone, and creates the necessary delegation records. Without proper delegation, subdomain
#     DNS queries would fail and SSL certificate validation would be impossible. This setup
#     ensures seamless DNS resolution from the parent domain to the subdomain infrastructure,
#     enabling automated certificate provisioning and domain management. The delegation records
#     are created with appropriate TTL values for optimal DNS propagation and performance.
# Dependencies: Requires route53.tf (subdomain hosted zone) and parent domain hosted zone
# Configuration: Uses domain name variables to detect parent-child relationships
# Implementation: Creates NS delegation records with automated parent domain detection

# Data source to get parent domain's hosted zone
data "aws_route53_zone" "parent" {
  count = var.domain_name != "" && var.create_route53_zone ? 1 : 0
  name  = replace(var.domain_name, "/^[^.]+\\./", "") # Remove first subdomain part
}

# NS delegation records in parent domain
resource "aws_route53_record" "ns_delegation" {
  count = var.domain_name != "" && var.create_route53_zone && length(data.aws_route53_zone.parent) > 0 ? 1 : 0

  zone_id = data.aws_route53_zone.parent[0].zone_id
  name    = var.domain_name
  type    = "NS"
  ttl     = 300

  records = aws_route53_zone.main[0].name_servers
}
