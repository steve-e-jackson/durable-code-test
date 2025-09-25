# Purpose: Automate NS delegation from parent domain to subdomain
# This ensures the subdomain's hosted zone is properly delegated
# Required for ACM certificate DNS validation to work

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
