
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  name: 'name',
  birthday: 'birthday',
  OTP: 'OTP',
  otpAttemptCount: 'otpAttemptCount',
  otpLockedUntil: 'otpLockedUntil',
  otpLastSentAt: 'otpLastSentAt',
  passwordHash: 'passwordHash',
  emailUnsubscribeToken: 'emailUnsubscribeToken',
  referralCode: 'referralCode',
  isBanned: 'isBanned',
  isEmailVerified: 'isEmailVerified',
  isPhoneVerified: 'isPhoneVerified',
  isEmailSubscribed: 'isEmailSubscribed',
  isPhoneSubscribed: 'isPhoneSubscribed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartScalarFieldEnum = {
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  variantId: 'variantId',
  count: 'count'
};

exports.Prisma.OwnerScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  name: 'name',
  avatar: 'avatar',
  OTP: 'OTP',
  otpAttemptCount: 'otpAttemptCount',
  otpLockedUntil: 'otpLockedUntil',
  otpLastSentAt: 'otpLastSentAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuthorScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  name: 'name',
  avatar: 'avatar',
  OTP: 'OTP',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BrandScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  logo: 'logo'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  title: 'title',
  shortDescription: 'shortDescription',
  description: 'description',
  images: 'images',
  keywords: 'keywords',
  metadata: 'metadata',
  price: 'price',
  discount: 'discount',
  stock: 'stock',
  isPhysical: 'isPhysical',
  isAvailable: 'isAvailable',
  isFeatured: 'isFeatured',
  brandId: 'brandId',
  kind: 'kind',
  category: 'category',
  status: 'status',
  fulfillmentMode: 'fulfillmentMode',
  personalizationAllowed: 'personalizationAllowed',
  publishedAt: 'publishedAt',
  legacyCategoryId: 'legacyCategoryId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductBundleItemScalarFieldEnum = {
  id: 'id',
  bundleId: 'bundleId',
  productId: 'productId',
  quantity: 'quantity',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  slug: 'slug'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  userId: 'userId',
  orderId: 'orderId',
  orderItemId: 'orderItemId',
  customerName: 'customerName',
  customerEmail: 'customerEmail',
  rating: 'rating',
  title: 'title',
  body: 'body',
  status: 'status',
  isFeatured: 'isFeatured',
  adminNote: 'adminNote',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  number: 'number',
  status: 'status',
  shippingStatus: 'shippingStatus',
  total: 'total',
  shipping: 'shipping',
  payable: 'payable',
  tax: 'tax',
  discount: 'discount',
  isPaid: 'isPaid',
  isCompleted: 'isCompleted',
  discountCodeId: 'discountCodeId',
  addressId: 'addressId',
  userId: 'userId',
  guestEmail: 'guestEmail',
  guestFirstName: 'guestFirstName',
  guestLastName: 'guestLastName',
  guestPhone: 'guestPhone',
  carrier: 'carrier',
  trackingCode: 'trackingCode',
  shippedAt: 'shippedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  variantId: 'variantId',
  count: 'count',
  price: 'price',
  discount: 'discount'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  country: 'country',
  address: 'address',
  city: 'city',
  phone: 'phone',
  postalCode: 'postalCode',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  content: 'content',
  isRead: 'isRead',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DiscountCodeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  stock: 'stock',
  description: 'description',
  percent: 'percent',
  maxDiscountAmount: 'maxDiscountAmount',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt'
};

exports.Prisma.RefundScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  reason: 'reason',
  orderId: 'orderId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  number: 'number',
  status: 'status',
  refId: 'refId',
  cardPan: 'cardPan',
  cardHash: 'cardHash',
  fee: 'fee',
  isSuccessful: 'isSuccessful',
  payable: 'payable',
  providerId: 'providerId',
  userId: 'userId',
  orderId: 'orderId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentProviderScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  websiteUrl: 'websiteUrl',
  isActive: 'isActive'
};

exports.Prisma.ErrorScalarFieldEnum = {
  id: 'id',
  error: 'error',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.FileScalarFieldEnum = {
  id: 'id',
  url: 'url',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.BlogScalarFieldEnum = {
  slug: 'slug',
  title: 'title',
  image: 'image',
  description: 'description',
  content: 'content',
  categories: 'categories',
  keywords: 'keywords',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BannerScalarFieldEnum = {
  id: 'id',
  label: 'label',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomeHeroScalarFieldEnum = {
  id: 'id',
  imageUrl: 'imageUrl',
  mobileImageUrl: 'mobileImageUrl',
  altText: 'altText',
  linkUrl: 'linkUrl',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomeCarouselSlideScalarFieldEnum = {
  id: 'id',
  imageUrl: 'imageUrl',
  mobileImageUrl: 'mobileImageUrl',
  altText: 'altText',
  title: 'title',
  subtitle: 'subtitle',
  linkUrl: 'linkUrl',
  isActive: 'isActive',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductVariantScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  sku: 'sku',
  title: 'title',
  price: 'price',
  compareAtPrice: 'compareAtPrice',
  active: 'active',
  leadTimeDays: 'leadTimeDays',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  variantId: 'variantId',
  trackQuantity: 'trackQuantity',
  quantityOnHand: 'quantityOnHand',
  quantityReserved: 'quantityReserved',
  allowBackorder: 'allowBackorder',
  reorderPoint: 'reorderPoint',
  lowStockThreshold: 'lowStockThreshold',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceivingDocumentScalarFieldEnum = {
  id: 'id',
  number: 'number',
  status: 'status',
  reference: 'reference',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  postedAt: 'postedAt'
};

exports.Prisma.ReceivingLineScalarFieldEnum = {
  id: 'id',
  receivingDocumentId: 'receivingDocumentId',
  variantId: 'variantId',
  quantity: 'quantity',
  unitCost: 'unitCost',
  lotId: 'lotId',
  notes: 'notes',
  position: 'position'
};

exports.Prisma.InventoryLotScalarFieldEnum = {
  id: 'id',
  variantId: 'variantId',
  lotCode: 'lotCode',
  receivedAt: 'receivedAt',
  expiryDate: 'expiryDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StockMovementScalarFieldEnum = {
  id: 'id',
  variantId: 'variantId',
  inventoryItemId: 'inventoryItemId',
  lotId: 'lotId',
  reason: 'reason',
  quantityDelta: 'quantityDelta',
  sourceDocumentId: 'sourceDocumentId',
  sourceLineId: 'sourceLineId',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.ProductOptionScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  name: 'name',
  position: 'position',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductOptionValueScalarFieldEnum = {
  id: 'id',
  optionId: 'optionId',
  value: 'value',
  position: 'position',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VariantOptionAssignmentScalarFieldEnum = {
  variantId: 'variantId',
  optionValueId: 'optionValueId',
  createdAt: 'createdAt'
};

exports.Prisma.ProductPersonalizationFieldScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  name: 'name',
  label: 'label',
  type: 'type',
  required: 'required',
  active: 'active',
  position: 'position',
  placeholder: 'placeholder',
  helpText: 'helpText',
  maxLength: 'maxLength',
  priceDelta: 'priceDelta',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BundleComponentScalarFieldEnum = {
  id: 'id',
  bundleVariantId: 'bundleVariantId',
  componentType: 'componentType',
  referencedVariantId: 'referencedVariantId',
  name: 'name',
  quantity: 'quantity',
  unit: 'unit',
  notes: 'notes',
  sortOrder: 'sortOrder',
  isOptional: 'isOptional',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  url: 'url',
  altText: 'altText',
  position: 'position',
  isCover: 'isCover',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ProductKind = exports.$Enums.ProductKind = {
  HANDMADE: 'HANDMADE',
  RESALE: 'RESALE',
  BUNDLE: 'BUNDLE'
};

exports.ProductCategory = exports.$Enums.ProductCategory = {
  DOLL: 'DOLL',
  BAG: 'BAG',
  COSTUME: 'COSTUME',
  YARN: 'YARN',
  ACCESSORY: 'ACCESSORY',
  KIT: 'KIT'
};

exports.ProductStatus = exports.$Enums.ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
};

exports.FulfillmentMode = exports.$Enums.FulfillmentMode = {
  READY: 'READY',
  MADE_TO_ORDER: 'MADE_TO_ORDER',
  BOTH: 'BOTH'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.OrderStatusEnum = exports.$Enums.OrderStatusEnum = {
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  ReturnProcessing: 'ReturnProcessing',
  ReturnCompleted: 'ReturnCompleted',
  Cancelled: 'Cancelled',
  RefundProcessing: 'RefundProcessing',
  RefundCompleted: 'RefundCompleted',
  Denied: 'Denied',
  Pending: 'Pending'
};

exports.ShippingStatus = exports.$Enums.ShippingStatus = {
  PENDING: 'PENDING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED'
};

exports.PaymentStatusEnum = exports.$Enums.PaymentStatusEnum = {
  Processing: 'Processing',
  Paid: 'Paid',
  Failed: 'Failed',
  Denied: 'Denied'
};

exports.ReceivingDocumentStatus = exports.$Enums.ReceivingDocumentStatus = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED'
};

exports.StockMovementReason = exports.$Enums.StockMovementReason = {
  RECEIPT: 'RECEIPT',
  ADJUSTMENT_IN: 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT: 'ADJUSTMENT_OUT'
};

exports.PersonalizationFieldType = exports.$Enums.PersonalizationFieldType = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  BOOLEAN: 'BOOLEAN'
};

exports.BundleComponentType = exports.$Enums.BundleComponentType = {
  CATALOG_VARIANT: 'CATALOG_VARIANT',
  CUSTOM_COMPONENT: 'CUSTOM_COMPONENT',
  DIGITAL_COMPONENT: 'DIGITAL_COMPONENT'
};

exports.Prisma.ModelName = {
  User: 'User',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Owner: 'Owner',
  Author: 'Author',
  Brand: 'Brand',
  Product: 'Product',
  ProductBundleItem: 'ProductBundleItem',
  Category: 'Category',
  Review: 'Review',
  Order: 'Order',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  OrderItem: 'OrderItem',
  Address: 'Address',
  Notification: 'Notification',
  DiscountCode: 'DiscountCode',
  Refund: 'Refund',
  Payment: 'Payment',
  PaymentProvider: 'PaymentProvider',
  Error: 'Error',
  File: 'File',
  Blog: 'Blog',
  Banner: 'Banner',
  HomeHero: 'HomeHero',
  HomeCarouselSlide: 'HomeCarouselSlide',
  ProductVariant: 'ProductVariant',
  InventoryItem: 'InventoryItem',
  ReceivingDocument: 'ReceivingDocument',
  ReceivingLine: 'ReceivingLine',
  InventoryLot: 'InventoryLot',
  StockMovement: 'StockMovement',
  ProductOption: 'ProductOption',
  ProductOptionValue: 'ProductOptionValue',
  VariantOptionAssignment: 'VariantOptionAssignment',
  ProductPersonalizationField: 'ProductPersonalizationField',
  BundleComponent: 'BundleComponent',
  ProductImage: 'ProductImage'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
