type MintedEvent = {
  type?: string
  payload?: string
  id?: number | string
  data?: {
    id?: number | string
  }
}

type TransactionResult = {
  status?: string
  status_code?: number
  execution?: string | { error?: { message?: string } }
  error_message?: string
  logs?: string[]
  events?: MintedEvent[]
}

export const extractFlowTransactionId = (responseData: Record<string, unknown>): string | undefined => {
  const value =
    responseData.id ||
    responseData.transactionId ||
    responseData.txId ||
    responseData.transaction_id
  return typeof value === 'string' ? value : undefined
}

export const isSealedWithError = (result: TransactionResult): boolean => {
  return (
    (result.status === 'Sealed' || result.status === 'SEALED') &&
    ((typeof result.status_code === 'number' && result.status_code !== 0) ||
      (typeof result.execution === 'string' && result.execution === 'Failure'))
  )
}

export const isSealedSuccess = (result: TransactionResult): boolean => {
  return (
    (result.status === 'Sealed' || result.status === 'SEALED') &&
    result.status_code === 0 &&
    typeof result.execution === 'string' &&
    result.execution === 'Success'
  )
}

export const extractFlowFailureMessage = (result: TransactionResult): string => {
  if (result.error_message) return result.error_message
  if (typeof result.execution === 'object' && result.execution?.error?.message) {
    return result.execution.error.message
  }
  if (Array.isArray(result.logs) && result.logs.length > 0) {
    const errorLog = result.logs.find(
      (log) => log.includes('error') || log.includes('panic') || log.includes('failed'),
    )
    if (errorLog) return errorLog
  }
  return 'Transaction failed'
}

export const extractCertificateIdFromEvents = ({
  events,
  contractAddress,
  contractName,
}: {
  events: MintedEvent[]
  contractAddress?: string
  contractName?: string
}): string | number | undefined => {
  const contractAddressHex = contractAddress?.replace('0x', '') || ''
  const mintedEvent = events.find(
    (event) =>
      event.type?.includes('Minted') ||
      event.type === `A.${contractAddressHex}.${contractName}.Minted` ||
      event.type === `A.${contractAddressHex}.${contractName}.CertificateNFT` ||
      event.type?.includes('CertificateMinted') ||
      event.type?.includes('CertificateNFT'),
  )

  if (!mintedEvent) return undefined
  if (mintedEvent.id !== undefined) return mintedEvent.id
  if (mintedEvent.data?.id !== undefined) return mintedEvent.data.id

  if (!mintedEvent.payload) return undefined

  const decodedPayload = Buffer.from(mintedEvent.payload, 'base64').toString('utf-8')
  const parsedPayload = JSON.parse(decodedPayload) as {
    id?: number | string
    value?: {
      fields?: Array<{ name?: string; value?: { value?: number | string } }>
    }
  }

  if (parsedPayload.value?.fields && Array.isArray(parsedPayload.value.fields)) {
    for (const field of parsedPayload.value.fields) {
      if (field.name === 'certificateId' || field.name === 'id' || field.name === 'tokenId') {
        if (field.value?.value !== undefined) return field.value.value
      }
    }
  }

  return parsedPayload.id
}
