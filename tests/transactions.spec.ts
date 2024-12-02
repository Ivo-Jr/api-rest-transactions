import { beforeAll, afterAll, it, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:latest --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (cookies) {
      const listTransactionResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

      expect(listTransactionResponse.body.transactions).toEqual([
        expect.objectContaining({
          title: 'New transactions',
          amount: 6500,
        }),
      ])
    }
  })

  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transactions',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (cookies) {
      const listTransactionResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

      const transactionId = listTransactionResponse.body.transactions[0].id

      const getTransactionResponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200)

      expect(getTransactionResponse.body.transactions).toEqual(
        expect.objectContaining({
          title: 'New transactions',
          amount: 6500,
        }),
      )
    }
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transactions',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (cookies) {
      await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
          title: 'Debit transactions',
          amount: 2500,
          type: 'debit',
        })
        .expect(201)

      const summaryResponse = await request(app.server)
        .get('/transactions/summary')
        .set('Cookie', cookies)
        .expect(200)

      expect(summaryResponse.body.summary).toEqual({
        amount: 4000,
      })
    }
  })
})
