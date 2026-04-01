import { env } from '@/lib/zod/env'

class ManagerService {
  // Get all accounts
  async getAccounts() {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/accounts`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Create a new account
  async createAccount() {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get a specific account
  async getAccount(accountId: string) {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/accounts/${accountId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get health status
  async getHealth() {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/health/liveness`)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get all jobs
  async getJobs() {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/jobs`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get a specific job
  async getJob(jobId: string) {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/jobs/${jobId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get all transactions
  async getTransactions() {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/transactions`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  // Get a specific transaction
  async getTransaction(transactionId: string) {
    try {
      const response = await fetch(`${env.BLOCKCHAIN_API_URL}/v1/transactions/${transactionId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
}

const managerService = new ManagerService()
export default managerService
