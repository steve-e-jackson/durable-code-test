config {
  # Use call_module_type instead of deprecated 'module' attribute
  call_module_type = "all"
  force = false

  # Disable warning-level rules - only report errors
  disabled_by_default = false
}

plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

# Disable the unused declarations rule - these are often intentional
# (variables used by modules, locals for future use, etc.)
rule "terraform_unused_declarations" {
  enabled = false
}