import { setupAccount } from './setup_account'
import { createOriginal } from './create_original'
import { createEdition } from './create_edition'
import { editEditionRules } from './admin_edit_edition_rules'
import { artistEditEditionRules } from './artist_edit_edition_rules'
import { adminMintCertificate } from './admin_mint_certificate'
import { mintCertificate } from './artist_mint_certificate'
import { claimMintCap } from './claim_mint_cap'
import { adminRepublishMintCap } from './admin_republish_mint_cap'
import { transferCertificate } from './transfer_certificate'
import { addFlowVaultsToCertificates } from './pistis_add_flowVault'
import { depositFlowToCertificate } from './pistis_deposit_flow'
import { withdrawFlow } from './withdraw_flow'
import { getCertificateBalance } from './get_certificate_balance'
import { transferFlowTokens } from './transfer_flow_tokens'
import { initEscrow } from './init_escrow'
import { claimEscrowCapability } from './claim_escrow_capability'
import { acceptEscrow } from './accept_escrow'
import { claimAndAcceptEscrow } from './claim_and_accept_escrow'
import { cancelEscrow } from './cancel_escrow'
import { updateMultipliers } from './admin_update_multipliers'

// Export all scripts as one object
const scripts = {
  setupAccount,
  createOriginal,
  createEdition,
  editEditionRules,
  artistEditEditionRules,
  adminMintCertificate,
  mintCertificate,
  claimMintCap,
  adminRepublishMintCap,
  transferCertificate,
  addFlowVaultsToCertificates,
  depositFlowToCertificate,
  withdrawFlow,
  getCertificateBalance,
  transferFlowTokens,
  initEscrow,
  claimEscrowCapability,
  acceptEscrow,
  claimAndAcceptEscrow,
  cancelEscrow,
  updateMultipliers,
}
export default scripts
