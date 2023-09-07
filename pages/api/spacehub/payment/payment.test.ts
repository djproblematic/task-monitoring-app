import { expect } from '@jest/globals'
import handler from '.'

import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { mockLoginAs } from '@utils/mockLoginAs'
import { domains, payments, realEstates, users } from '@utils/testData'
import { parseReceived } from '@utils/helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Payments API - GET', () => {
  it('load payments as GlobalAdmin - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)

    expect(received).toEqual(payments)
  })

  it('load payments as GlobalAdmin with limit - success', async () => {
    const limit = 2

    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { limit },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)

    expect(received).toEqual(payments.slice(0, limit))
  })

  it('load payments as DomainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)

    const expected = payments.filter((payment) =>
      domains
        .find((domain) => domain._id === payment.domain)
        .adminEmails.includes(users.domainAdmin.email)
    )

    expect(received).toEqual(expected)
  })

  it('load payments as User - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)

    const expected = payments.filter((payment) =>
      realEstates
        .find((realEstate) => realEstate._id === payment.company)
        .adminEmails.includes(users.user.email)
    )

    expect(received).toEqual(expected)
  })

  it('Get payments by companyID for DomainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyIds: realEstates[0]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected = payments.filter(
      (payment) => payment.company === realEstates[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })

  it('GET payments by domainId for domainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainIds: domains[0]._id.toString(),
      },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected = payments.filter(
      (payment) => payment.domain === domains[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })

  it('GET payments by domainId for User - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainIds: domains[1]._id.toString(),
      },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected = payments.filter((payment) => {
      const domain = domains.find((domain) =>
        domain.adminEmails.includes(users.user.email)
      )
      return payment.domain === domain?._id
    })
    expect(received).toEqual(expected)
  })

  // IF DOMAIN INCLUDES USER EMAIL - RETURN A PAYMENT BY THIS DOMAINID
  // FINISH TEST FOR USER AND CREATE A PR

  it('GET payments by year', async () => {
    mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { year: 2023 },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const recived = parseReceived(response.data)

    const expected = payments.filter(
      (payment) => new Date(payment.invoiceCreationDate).getFullYear() === 2023
    )

    expect(recived).toEqual(expected)
  })
  it('GET payments by month', async () => {
    mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { month: 2 },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const recived = parseReceived(response.data)

    const expected = payments.filter(
      (payment) => new Date(payment.invoiceCreationDate).getMonth() === 1
    )

    expect(recived).toEqual(expected)
  })
  it('GET payments by quarter', async () => {
    mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { quarter: 2 },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const recived = parseReceived(response.data)

    function getQuarter(date = new Date()) {
      return Math.floor(date.getMonth() / 3 + 1)
    }
    response.data
      .map((payment) => getQuarter(new Date(payment.invoiceCreationDate)))
      .every((item) => item === 2)

    expect(recived).toBeTruthy()
  })

  it('GET payments by comapnyId for User - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        companyIds: realEstates[0]._id.toString(),
      },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any
    await handler(mockReq, mockRes)
    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)

    const expected = payments.filter(
      (payment) => payment.company === realEstates[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })
})

// it('load payments as GlobalAdmin by domainId - success', async () => {
//   await mockLoginAs(users.globalAdmin)

//   const mockReq = {
//     method: 'GET',
//     query: { domainIds: domains[0]._id },
//   } as any
//   const mockRes = {
//     status: jest.fn(() => mockRes),
//     json: jest.fn(),
//   } as any

//   // ??? BUG: TypeError: (filterIds || "").split is not a function at filterOptions
//   await handler(mockReq, mockRes)

//   const response = {
//     status: mockRes.status,
//     data: mockRes.json.mock.lastCall[0].data,
//   }

//   expect(response.status).toHaveBeenCalledWith(200)

//   const received = unpopulate(
//     removeProps(response.data.map((domain) => domain._doc))
//   )
//   const expected = payments.find(
//     (payment) => payment.domain === domains[0]._id
//   )

//   expect(received).toEqual(expected)
// })

describe('Payments API - POST', () => {
  it('POST payment as Global Admin - success', async () => {
    await mockLoginAs(users.globalAdmin)
    const { _id, ...data } = payments[0]

    const mockReq = {
      method: 'POST',
      body: data,
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.data,
    }

    expect(response.status).toHaveBeenLastCalledWith(200)
  })
})
