import { randomInt } from 'node:crypto'

export function generateSerial({
   batchCount = 1,
   batchSize = 6,
   alphanumeric = false,
}) {
   function generateAlphanumerics() {
      let generation = ''
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

      for (let i = 0; i < batchSize; i++) {
         generation += alphabet[randomInt(0, alphabet.length)]
      }

      return generation
   }

   function generateNumerics() {
      const upperBound = Math.pow(10, batchSize)
      return randomInt(0, upperBound).toString().padStart(batchSize, '0')
   }

   let voucher = ''

   voucher = voucher.concat(
      alphanumeric ? generateAlphanumerics() : generateNumerics()
   )

   for (let i = 1; i < batchCount; i++) {
      voucher = voucher.concat('-')
      voucher = voucher.concat(
         alphanumeric ? generateAlphanumerics() : generateNumerics()
      )
   }

   return voucher
}
