provider "azurerm" {
  features {}
}

# Parameters
variable "environments" {
  type    = list(string)
  default = ["dev", "tst", "prd"]
}

variable "app_name_prefix" {
  type    = string
  default = "dsbchatgpt-ui"
}

variable "redirect_urls" {
  type    = map(list(string))
  default = {
    dev = ["http://localhost:3000", "https://dsbchatgpt-ui.dev.azure.dsb.dk/"],
    tst = ["https://dsbchatgpt-ui.tst.azure.dsb.dk/"],
    prd = ["https://dsbchatgpt-ui.prd.azure.dsb.dk/"]
  }
}

variable "allow_implicit_flow" {
  type    = bool
  default = true
}

variable "allow_id_token_implicit" {
  type    = bool
  default = true
}

resource "azurerm_azuread_application" "app_registration" {
  for_each = { for env in var.environments : env => var.redirect_urls[env] }

  name                       = "${var.app_name_prefix}-${each.key}"
  reply_urls                 = each.value
  available_to_other_tenants = false
  oauth2_allow_implicit_flow          = var.allow_implicit_flow
  oauth2_allow_id_token_implicit_flow = var.allow_id_token_implicit
}

resource "azurerm_azuread_service_principal" "app_sp" {
  for_each = azurerm_azuread_application.app_registration
  application_id = each.value.application_id
}

# Output variables
output "application_ids" {
  value = azurerm_azuread_application.app_registration[*].application_id
}