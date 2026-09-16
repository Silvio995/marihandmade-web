
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/wasm.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/tmp/repo-prisma-generate-DYdSTV/package/src/generated/client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "debian-openssl-3.0.x",
        "native": true
      },
      {
        "fromEnvVar": null,
        "value": "debian-openssl-3.0.x"
      },
      {
        "fromEnvVar": null,
        "value": "rhel-openssl-3.0.x"
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "/tmp/repo-prisma-generate-DYdSTV/package/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../../../../home/mazza/projects/shop/marìShop/packages/prisma/.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../src/generated/client\"\n  previewFeatures = [\"driverAdapters\"]\n  binaryTargets   = [\"native\", \"debian-openssl-3.0.x\", \"rhel-openssl-3.0.x\"]\n}\n\ndatasource db {\n  provider  = \"postgresql\"\n  url       = env(\"DATABASE_URL\")\n  directUrl = env(\"DIRECT_URL\")\n}\n\nenum ProductKind {\n  HANDMADE\n  RESALE\n  BUNDLE\n}\n\nenum ProductCategory {\n  DOLL\n  BAG\n  COSTUME\n  YARN\n  ACCESSORY\n  KIT\n}\n\nenum ProductStatus {\n  DRAFT\n  ACTIVE\n  ARCHIVED\n}\n\nenum FulfillmentMode {\n  READY\n  MADE_TO_ORDER\n  BOTH\n}\n\nenum PersonalizationFieldType {\n  TEXT\n  TEXTAREA\n  SELECT\n  BOOLEAN\n}\n\nenum BundleComponentType {\n  CATALOG_VARIANT\n  CUSTOM_COMPONENT\n  DIGITAL_COMPONENT\n}\n\nenum ReceivingDocumentStatus {\n  DRAFT\n  POSTED\n}\n\nenum StockMovementReason {\n  RECEIPT\n  ADJUSTMENT_IN\n  ADJUSTMENT_OUT\n}\n\nenum ReviewStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nmodel User {\n  id                    String         @id @default(cuid())\n  email                 String?        @unique\n  phone                 String?        @unique\n  name                  String?\n  birthday              String?\n  OTP                   String?\n  otpAttemptCount       Int            @default(0)\n  otpLockedUntil        DateTime?\n  otpLastSentAt         DateTime?\n  passwordHash          String?\n  emailUnsubscribeToken String?        @unique @default(cuid())\n  referralCode          String?        @unique\n  isBanned              Boolean        @default(false)\n  isEmailVerified       Boolean        @default(false)\n  isPhoneVerified       Boolean        @default(false)\n  isEmailSubscribed     Boolean        @default(false)\n  isPhoneSubscribed     Boolean        @default(false)\n  createdAt             DateTime       @default(now())\n  updatedAt             DateTime       @updatedAt\n  addresses             Address[]\n  cart                  Cart?\n  errors                Error[]\n  files                 File[]\n  notifications         Notification[]\n  orders                Order[]\n  payments              Payment[]\n  reviews               Review[]\n  wishlist              Product[]      @relation(\"Wishlist\")\n  accounts              Account[]\n  sessions              Session[]\n}\n\nmodel Cart {\n  userId    String     @id\n  createdAt DateTime   @default(now())\n  updatedAt DateTime   @updatedAt\n  user      User       @relation(fields: [userId], references: [id])\n  items     CartItem[]\n}\n\nmodel CartItem {\n  id        String          @id @default(cuid())\n  cartId    String\n  productId String\n  variantId String?\n  count     Int\n  cart      Cart            @relation(fields: [cartId], references: [userId])\n  product   Product         @relation(fields: [productId], references: [id])\n  variant   ProductVariant? @relation(fields: [variantId], references: [id])\n}\n\nmodel Owner {\n  id              String    @id @default(cuid())\n  email           String    @unique\n  phone           String?   @unique\n  name            String?\n  avatar          String?\n  OTP             String?\n  otpAttemptCount Int       @default(0)\n  otpLockedUntil  DateTime?\n  otpLastSentAt   DateTime?\n  createdAt       DateTime  @default(now())\n  updatedAt       DateTime  @updatedAt\n}\n\nmodel Author {\n  id        String   @id @default(cuid())\n  email     String   @unique\n  phone     String?  @unique\n  name      String?\n  avatar    String?\n  OTP       String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  blogs     Blog[]\n}\n\nmodel Brand {\n  id          String    @id @default(cuid())\n  title       String    @unique\n  description String?\n  logo        String?\n  products    Product[]\n}\n\nmodel Product {\n  id                     String                        @id @default(cuid())\n  slug                   String?                       @unique\n  title                  String\n  shortDescription       String?\n  description            String?\n  images                 String[]\n  keywords               String[]\n  metadata               Json?\n  price                  Float                         @default(100)\n  discount               Float                         @default(0)\n  stock                  Int                           @default(0)\n  isPhysical             Boolean                       @default(true)\n  isAvailable            Boolean                       @default(false)\n  isFeatured             Boolean                       @default(false)\n  brandId                String\n  kind                   ProductKind?\n  category               ProductCategory?\n  status                 ProductStatus?\n  fulfillmentMode        FulfillmentMode?\n  personalizationAllowed Boolean                       @default(false)\n  publishedAt            DateTime?\n  legacyCategoryId       String?\n  createdAt              DateTime                      @default(now())\n  updatedAt              DateTime                      @updatedAt\n  cartItems              CartItem[]\n  orders                 OrderItem[]\n  brand                  Brand                         @relation(fields: [brandId], references: [id])\n  bundleItems            ProductBundleItem[]           @relation(\"BundleParent\")\n  bundledIn              ProductBundleItem[]           @relation(\"BundleChild\")\n  reviews                Review[]\n  categories             Category[]                    @relation(\"CategoryToProduct\")\n  wishlists              User[]                        @relation(\"Wishlist\")\n  variants               ProductVariant[]\n  options                ProductOption[]\n  personalizationFields  ProductPersonalizationField[]\n  productImages          ProductImage[]\n  legacyCategory         Category?                     @relation(\"LegacyProductCategory\", fields: [legacyCategoryId], references: [id])\n\n  @@index([brandId])\n  @@index([kind])\n  @@index([category])\n  @@index([status])\n  @@index([fulfillmentMode])\n}\n\nmodel ProductBundleItem {\n  id        String   @id @default(cuid())\n  bundleId  String\n  productId String\n  quantity  Int      @default(1)\n  createdAt DateTime @default(now())\n  bundle    Product  @relation(\"BundleParent\", fields: [bundleId], references: [id])\n  product   Product  @relation(\"BundleChild\", fields: [productId], references: [id])\n\n  @@unique([bundleId, productId])\n  @@index([bundleId])\n  @@index([productId])\n}\n\nmodel Category {\n  id             String    @id @default(cuid())\n  title          String    @unique\n  description    String?\n  createdAt      DateTime  @default(now())\n  updatedAt      DateTime  @updatedAt\n  slug           String    @unique\n  banners        Banner[]  @relation(\"BannerToCategory\")\n  products       Product[] @relation(\"CategoryToProduct\")\n  legacyProducts Product[] @relation(\"LegacyProductCategory\")\n\n  @@index([slug])\n}\n\nmodel Review {\n  id            String       @id @default(cuid())\n  productId     String\n  userId        String?\n  orderId       String?\n  orderItemId   String?\n  customerName  String\n  customerEmail String?\n  rating        Int\n  title         String?\n  body          String       @map(\"text\")\n  status        ReviewStatus @default(PENDING)\n  isFeatured    Boolean      @default(false)\n  adminNote     String?\n  createdAt     DateTime     @default(now())\n  updatedAt     DateTime     @updatedAt\n  product       Product      @relation(fields: [productId], references: [id])\n  user          User?        @relation(fields: [userId], references: [id])\n  order         Order?       @relation(fields: [orderId], references: [id])\n  orderItem     OrderItem?   @relation(fields: [orderItemId], references: [id])\n\n  @@index([productId])\n  @@index([userId])\n  @@index([orderId])\n  @@index([orderItemId])\n  @@index([status])\n  @@index([createdAt])\n  @@index([productId, status])\n  @@index([isFeatured])\n  @@map(\"ProductReview\")\n}\n\nmodel Order {\n  id             String          @id @default(cuid())\n  number         Int             @unique @default(autoincrement())\n  status         OrderStatusEnum\n  shippingStatus ShippingStatus  @default(PENDING)\n  total          Float           @default(100)\n  shipping       Float           @default(100)\n  payable        Float           @default(100)\n  tax            Float           @default(100)\n  discount       Float           @default(0)\n  isPaid         Boolean         @default(false)\n  isCompleted    Boolean         @default(false)\n  discountCodeId String?\n  addressId      String?\n  userId         String?\n  guestEmail     String?\n  guestFirstName String?\n  guestLastName  String?\n  guestPhone     String?\n  carrier        String?\n  trackingCode   String?\n  shippedAt      DateTime?\n  createdAt      DateTime        @default(now())\n  updatedAt      DateTime        @updatedAt\n  address        Address?        @relation(fields: [addressId], references: [id])\n  discountCode   DiscountCode?   @relation(fields: [discountCodeId], references: [id])\n  user           User?           @relation(fields: [userId], references: [id])\n  orderItems     OrderItem[]\n  payments       Payment[]\n  reviews        Review[]\n  refund         Refund?\n\n  @@index([userId])\n  @@index([addressId])\n  @@index([discountCodeId])\n}\n\nmodel Account {\n  id                String  @id @default(cuid())\n  userId            String\n  type              String\n  provider          String\n  providerAccountId String\n  refresh_token     String?\n  access_token      String?\n  expires_at        Int?\n  token_type        String?\n  scope             String?\n  id_token          String?\n  session_state     String?\n  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerAccountId])\n  @@index([userId])\n}\n\nmodel Session {\n  id           String   @id @default(cuid())\n  sessionToken String   @unique\n  userId       String\n  expires      DateTime\n  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n}\n\nmodel VerificationToken {\n  identifier String\n  token      String   @unique\n  expires    DateTime\n\n  @@unique([identifier, token])\n}\n\nmodel OrderItem {\n  id        String          @id @default(cuid())\n  orderId   String\n  productId String\n  variantId String?\n  count     Int\n  price     Float\n  discount  Float\n  order     Order           @relation(fields: [orderId], references: [id])\n  product   Product         @relation(fields: [productId], references: [id])\n  variant   ProductVariant? @relation(fields: [variantId], references: [id])\n  reviews   Review[]\n\n  @@index([orderId])\n  @@index([productId])\n  @@index([variantId])\n}\n\nmodel Address {\n  id         String   @id @default(cuid())\n  country    String   @default(\"IRI\")\n  address    String\n  city       String\n  phone      String\n  postalCode String\n  userId     String\n  createdAt  DateTime @default(now())\n  user       User     @relation(fields: [userId], references: [id])\n  orders     Order[]\n\n  @@index([userId])\n}\n\nmodel Notification {\n  id        String   @id @default(cuid())\n  content   String\n  isRead    Boolean  @default(false)\n  userId    String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  user      User     @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n}\n\nmodel DiscountCode {\n  id                String   @id @default(cuid())\n  code              String   @unique\n  stock             Int      @default(1)\n  description       String?\n  percent           Int\n  maxDiscountAmount Float    @default(1)\n  startDate         DateTime\n  endDate           DateTime\n  createdAt         DateTime @default(now())\n  order             Order[]\n}\n\nmodel Refund {\n  id        String   @id @default(cuid())\n  amount    Float\n  reason    String\n  orderId   String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  order     Order    @relation(fields: [orderId], references: [id])\n\n  @@index([orderId])\n}\n\nmodel Payment {\n  id           String            @id @default(cuid())\n  number       Int               @unique @default(autoincrement())\n  status       PaymentStatusEnum\n  refId        String            @unique\n  cardPan      String?\n  cardHash     String?\n  fee          Float?\n  isSuccessful Boolean           @default(false)\n  payable      Float\n  providerId   String\n  userId       String?\n  orderId      String\n  createdAt    DateTime          @default(now())\n  updatedAt    DateTime          @updatedAt\n  order        Order             @relation(fields: [orderId], references: [id])\n  provider     PaymentProvider   @relation(fields: [providerId], references: [id])\n  user         User?             @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n  @@index([providerId])\n  @@index([orderId])\n}\n\nmodel PaymentProvider {\n  id          String    @id @default(cuid())\n  title       String    @unique\n  description String?\n  websiteUrl  String?\n  isActive    Boolean   @default(false)\n  orders      Payment[]\n}\n\nmodel Error {\n  id        String   @id @default(cuid())\n  error     String\n  userId    String?\n  createdAt DateTime @default(now())\n  user      User?    @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n}\n\nmodel File {\n  id        String   @id @default(cuid())\n  url       String\n  userId    String\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n}\n\nmodel Blog {\n  slug        String   @id\n  title       String\n  image       String\n  description String\n  content     String?\n  categories  String[]\n  keywords    String[]\n  authorId    String\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n  author      Author   @relation(fields: [authorId], references: [id])\n\n  @@index([authorId])\n}\n\nmodel Banner {\n  id         String     @id @default(cuid())\n  label      String\n  image      String\n  createdAt  DateTime   @default(now())\n  updatedAt  DateTime   @updatedAt\n  categories Category[] @relation(\"BannerToCategory\")\n}\n\nmodel HomeHero {\n  id             String   @id @default(cuid())\n  imageUrl       String\n  mobileImageUrl String?\n  altText        String\n  linkUrl        String?\n  isActive       Boolean  @default(true)\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  @@index([isActive, updatedAt])\n}\n\nmodel HomeCarouselSlide {\n  id             String   @id @default(cuid())\n  imageUrl       String\n  mobileImageUrl String?\n  altText        String\n  title          String?\n  subtitle       String?\n  linkUrl        String?\n  isActive       Boolean  @default(true)\n  sortOrder      Int      @default(0)\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  @@index([isActive, sortOrder])\n}\n\nmodel ProductVariant {\n  id                  String                    @id @default(cuid())\n  productId           String\n  sku                 String                    @unique\n  title               String?\n  price               Float\n  compareAtPrice      Float?\n  active              Boolean                   @default(true)\n  leadTimeDays        Int?\n  createdAt           DateTime                  @default(now())\n  updatedAt           DateTime                  @updatedAt\n  product             Product                   @relation(fields: [productId], references: [id])\n  inventory           InventoryItem?\n  optionAssignments   VariantOptionAssignment[]\n  bundleComponents    BundleComponent[]         @relation(\"BundleAsParent\")\n  referencedInBundles BundleComponent[]         @relation(\"BundleAsChild\")\n  cartItems           CartItem[]\n  orderItems          OrderItem[]\n  receivingLines      ReceivingLine[]\n  inventoryLots       InventoryLot[]\n  stockMovements      StockMovement[]\n\n  @@index([productId])\n}\n\nmodel InventoryItem {\n  id                String          @id @default(cuid())\n  variantId         String          @unique\n  trackQuantity     Boolean         @default(true)\n  quantityOnHand    Int             @default(0)\n  quantityReserved  Int             @default(0)\n  allowBackorder    Boolean         @default(false)\n  reorderPoint      Int?\n  lowStockThreshold Int?\n  createdAt         DateTime        @default(now())\n  updatedAt         DateTime        @updatedAt\n  variant           ProductVariant  @relation(fields: [variantId], references: [id])\n  stockMovements    StockMovement[]\n}\n\nmodel ReceivingDocument {\n  id             String                  @id @default(cuid())\n  number         Int                     @unique @default(autoincrement())\n  status         ReceivingDocumentStatus\n  reference      String?\n  notes          String?\n  createdAt      DateTime                @default(now())\n  updatedAt      DateTime                @updatedAt\n  postedAt       DateTime?\n  lines          ReceivingLine[]\n  stockMovements StockMovement[]\n}\n\nmodel ReceivingLine {\n  id                  String            @id @default(cuid())\n  receivingDocumentId String\n  variantId           String\n  quantity            Int\n  unitCost            Float?\n  lotId               String?\n  notes               String?\n  position            Int\n  receivingDocument   ReceivingDocument @relation(fields: [receivingDocumentId], references: [id])\n  variant             ProductVariant    @relation(fields: [variantId], references: [id])\n  lot                 InventoryLot?     @relation(fields: [lotId], references: [id])\n  stockMovements      StockMovement[]\n\n  @@unique([receivingDocumentId, position])\n  @@index([receivingDocumentId])\n  @@index([variantId])\n  @@index([lotId])\n}\n\nmodel InventoryLot {\n  id             String          @id @default(cuid())\n  variantId      String\n  lotCode        String\n  receivedAt     DateTime        @default(now())\n  expiryDate     DateTime?\n  createdAt      DateTime        @default(now())\n  updatedAt      DateTime        @updatedAt\n  variant        ProductVariant  @relation(fields: [variantId], references: [id])\n  receivingLines ReceivingLine[]\n  stockMovements StockMovement[]\n\n  @@unique([variantId, lotCode])\n  @@index([variantId])\n}\n\nmodel StockMovement {\n  id               String              @id @default(cuid())\n  variantId        String\n  inventoryItemId  String\n  lotId            String?\n  reason           StockMovementReason\n  quantityDelta    Int\n  sourceDocumentId String?\n  sourceLineId     String?\n  notes            String?\n  createdAt        DateTime            @default(now())\n  variant          ProductVariant      @relation(fields: [variantId], references: [id])\n  inventoryItem    InventoryItem       @relation(fields: [inventoryItemId], references: [id])\n  lot              InventoryLot?       @relation(fields: [lotId], references: [id])\n  sourceDocument   ReceivingDocument?  @relation(fields: [sourceDocumentId], references: [id])\n  sourceLine       ReceivingLine?      @relation(fields: [sourceLineId], references: [id])\n\n  @@index([variantId])\n  @@index([inventoryItemId])\n  @@index([lotId])\n  @@index([sourceDocumentId])\n  @@index([sourceLineId])\n}\n\nmodel ProductOption {\n  id        String               @id @default(cuid())\n  productId String\n  name      String\n  position  Int\n  createdAt DateTime             @default(now())\n  updatedAt DateTime             @updatedAt\n  product   Product              @relation(fields: [productId], references: [id])\n  values    ProductOptionValue[]\n\n  @@unique([productId, name])\n  @@index([productId])\n}\n\nmodel ProductOptionValue {\n  id          String                    @id @default(cuid())\n  optionId    String\n  value       String\n  position    Int\n  createdAt   DateTime                  @default(now())\n  updatedAt   DateTime                  @updatedAt\n  option      ProductOption             @relation(fields: [optionId], references: [id])\n  assignments VariantOptionAssignment[]\n\n  @@unique([optionId, value])\n  @@index([optionId])\n}\n\nmodel VariantOptionAssignment {\n  variantId     String\n  optionValueId String\n  createdAt     DateTime           @default(now())\n  variant       ProductVariant     @relation(fields: [variantId], references: [id])\n  optionValue   ProductOptionValue @relation(fields: [optionValueId], references: [id])\n\n  @@id([variantId, optionValueId])\n}\n\nmodel ProductPersonalizationField {\n  id          String                   @id @default(cuid())\n  productId   String\n  name        String\n  label       String\n  type        PersonalizationFieldType\n  required    Boolean                  @default(false)\n  active      Boolean                  @default(true)\n  position    Int\n  placeholder String?\n  helpText    String?\n  maxLength   Int?\n  priceDelta  Float?\n  createdAt   DateTime                 @default(now())\n  updatedAt   DateTime                 @updatedAt\n  product     Product                  @relation(fields: [productId], references: [id])\n\n  @@unique([productId, name])\n  @@index([productId])\n}\n\nmodel BundleComponent {\n  id                  String              @id @default(cuid())\n  bundleVariantId     String\n  componentType       BundleComponentType\n  referencedVariantId String?\n  name                String\n  quantity            Int\n  unit                String?\n  notes               String?\n  sortOrder           Int\n  isOptional          Boolean             @default(false)\n  createdAt           DateTime            @default(now())\n  updatedAt           DateTime            @updatedAt\n  bundleVariant       ProductVariant      @relation(\"BundleAsParent\", fields: [bundleVariantId], references: [id])\n  referencedVariant   ProductVariant?     @relation(\"BundleAsChild\", fields: [referencedVariantId], references: [id])\n\n  @@index([bundleVariantId])\n  @@index([referencedVariantId])\n}\n\nmodel ProductImage {\n  id        String   @id @default(cuid())\n  productId String\n  url       String\n  altText   String?\n  position  Int\n  isCover   Boolean  @default(false)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  product   Product  @relation(fields: [productId], references: [id])\n\n  @@index([productId])\n}\n\nenum OrderStatusEnum {\n  Processing\n  Shipped\n  Delivered\n  ReturnProcessing\n  ReturnCompleted\n  Cancelled\n  RefundProcessing\n  RefundCompleted\n  Denied\n  Pending\n}\n\nenum PaymentStatusEnum {\n  Processing\n  Paid\n  Failed\n  Denied\n}\n\nenum ShippingStatus {\n  PENDING\n  READY_TO_SHIP\n  SHIPPED\n}\n",
  "inlineSchemaHash": "297da8b5229dfbb6e57c4d9c14bf6e3df0252053a799583276bda59a62d60f01",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"birthday\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"OTP\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"otpAttemptCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"otpLockedUntil\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"otpLastSentAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"passwordHash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emailUnsubscribeToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"referralCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isBanned\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isEmailVerified\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isPhoneVerified\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isEmailSubscribed\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isPhoneSubscribed\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"addresses\",\"kind\":\"object\",\"type\":\"Address\",\"relationName\":\"AddressToUser\"},{\"name\":\"cart\",\"kind\":\"object\",\"type\":\"Cart\",\"relationName\":\"CartToUser\"},{\"name\":\"errors\",\"kind\":\"object\",\"type\":\"Error\",\"relationName\":\"ErrorToUser\"},{\"name\":\"files\",\"kind\":\"object\",\"type\":\"File\",\"relationName\":\"FileToUser\"},{\"name\":\"notifications\",\"kind\":\"object\",\"type\":\"Notification\",\"relationName\":\"NotificationToUser\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToUser\"},{\"name\":\"payments\",\"kind\":\"object\",\"type\":\"Payment\",\"relationName\":\"PaymentToUser\"},{\"name\":\"reviews\",\"kind\":\"object\",\"type\":\"Review\",\"relationName\":\"ReviewToUser\"},{\"name\":\"wishlist\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"Wishlist\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"}],\"dbName\":null},\"Cart\":{\"fields\":[{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CartToUser\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"CartItem\",\"relationName\":\"CartToCartItem\"}],\"dbName\":null},\"CartItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"cartId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"count\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"cart\",\"kind\":\"object\",\"type\":\"Cart\",\"relationName\":\"CartToCartItem\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CartItemToProduct\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"CartItemToProductVariant\"}],\"dbName\":null},\"Owner\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"avatar\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"OTP\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"otpAttemptCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"otpLockedUntil\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"otpLastSentAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Author\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"avatar\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"OTP\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"blogs\",\"kind\":\"object\",\"type\":\"Blog\",\"relationName\":\"AuthorToBlog\"}],\"dbName\":null},\"Brand\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logo\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"BrandToProduct\"}],\"dbName\":null},\"Product\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"slug\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"shortDescription\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"images\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"keywords\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"discount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isPhysical\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isAvailable\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isFeatured\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"brandId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"kind\",\"kind\":\"enum\",\"type\":\"ProductKind\"},{\"name\":\"category\",\"kind\":\"enum\",\"type\":\"ProductCategory\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"ProductStatus\"},{\"name\":\"fulfillmentMode\",\"kind\":\"enum\",\"type\":\"FulfillmentMode\"},{\"name\":\"personalizationAllowed\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"publishedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"legacyCategoryId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"cartItems\",\"kind\":\"object\",\"type\":\"CartItem\",\"relationName\":\"CartItemToProduct\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"OrderItemToProduct\"},{\"name\":\"brand\",\"kind\":\"object\",\"type\":\"Brand\",\"relationName\":\"BrandToProduct\"},{\"name\":\"bundleItems\",\"kind\":\"object\",\"type\":\"ProductBundleItem\",\"relationName\":\"BundleParent\"},{\"name\":\"bundledIn\",\"kind\":\"object\",\"type\":\"ProductBundleItem\",\"relationName\":\"BundleChild\"},{\"name\":\"reviews\",\"kind\":\"object\",\"type\":\"Review\",\"relationName\":\"ProductToReview\"},{\"name\":\"categories\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToProduct\"},{\"name\":\"wishlists\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"Wishlist\"},{\"name\":\"variants\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"ProductToProductVariant\"},{\"name\":\"options\",\"kind\":\"object\",\"type\":\"ProductOption\",\"relationName\":\"ProductToProductOption\"},{\"name\":\"personalizationFields\",\"kind\":\"object\",\"type\":\"ProductPersonalizationField\",\"relationName\":\"ProductToProductPersonalizationField\"},{\"name\":\"productImages\",\"kind\":\"object\",\"type\":\"ProductImage\",\"relationName\":\"ProductToProductImage\"},{\"name\":\"legacyCategory\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"LegacyProductCategory\"}],\"dbName\":null},\"ProductBundleItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"bundleId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"bundle\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"BundleParent\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"BundleChild\"}],\"dbName\":null},\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"slug\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"banners\",\"kind\":\"object\",\"type\":\"Banner\",\"relationName\":\"BannerToCategory\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CategoryToProduct\"},{\"name\":\"legacyProducts\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"LegacyProductCategory\"}],\"dbName\":null},\"Review\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"customerName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"customerEmail\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"rating\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"body\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"text\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"ReviewStatus\"},{\"name\":\"isFeatured\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"adminNote\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToReview\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"ReviewToUser\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToReview\"},{\"name\":\"orderItem\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"OrderItemToReview\"}],\"dbName\":\"ProductReview\"},\"Order\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"number\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"OrderStatusEnum\"},{\"name\":\"shippingStatus\",\"kind\":\"enum\",\"type\":\"ShippingStatus\"},{\"name\":\"total\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"shipping\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"payable\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"tax\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"discount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"isPaid\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isCompleted\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"discountCodeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"addressId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"guestEmail\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"guestFirstName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"guestLastName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"guestPhone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"carrier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"trackingCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"shippedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"address\",\"kind\":\"object\",\"type\":\"Address\",\"relationName\":\"AddressToOrder\"},{\"name\":\"discountCode\",\"kind\":\"object\",\"type\":\"DiscountCode\",\"relationName\":\"DiscountCodeToOrder\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"OrderToUser\"},{\"name\":\"orderItems\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"OrderToOrderItem\"},{\"name\":\"payments\",\"kind\":\"object\",\"type\":\"Payment\",\"relationName\":\"OrderToPayment\"},{\"name\":\"reviews\",\"kind\":\"object\",\"type\":\"Review\",\"relationName\":\"OrderToReview\"},{\"name\":\"refund\",\"kind\":\"object\",\"type\":\"Refund\",\"relationName\":\"OrderToRefund\"}],\"dbName\":null},\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session_state\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":null},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"}],\"dbName\":null},\"VerificationToken\":{\"fields\":[{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"OrderItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"count\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"discount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToOrderItem\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"OrderItemToProduct\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"OrderItemToProductVariant\"},{\"name\":\"reviews\",\"kind\":\"object\",\"type\":\"Review\",\"relationName\":\"OrderItemToReview\"}],\"dbName\":null},\"Address\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"country\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"address\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"city\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"postalCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AddressToUser\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"AddressToOrder\"}],\"dbName\":null},\"Notification\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isRead\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"NotificationToUser\"}],\"dbName\":null},\"DiscountCode\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"code\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stock\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"percent\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"maxDiscountAmount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"startDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"DiscountCodeToOrder\"}],\"dbName\":null},\"Refund\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"amount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"reason\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToRefund\"}],\"dbName\":null},\"Payment\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"number\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"PaymentStatusEnum\"},{\"name\":\"refId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"cardPan\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"cardHash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fee\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"isSuccessful\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"payable\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"providerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToPayment\"},{\"name\":\"provider\",\"kind\":\"object\",\"type\":\"PaymentProvider\",\"relationName\":\"PaymentToPaymentProvider\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PaymentToUser\"}],\"dbName\":null},\"PaymentProvider\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"websiteUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Payment\",\"relationName\":\"PaymentToPaymentProvider\"}],\"dbName\":null},\"Error\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"error\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"ErrorToUser\"}],\"dbName\":null},\"File\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"FileToUser\"}],\"dbName\":null},\"Blog\":{\"fields\":[{\"name\":\"slug\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"categories\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"keywords\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"authorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"author\",\"kind\":\"object\",\"type\":\"Author\",\"relationName\":\"AuthorToBlog\"}],\"dbName\":null},\"Banner\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"label\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"categories\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"BannerToCategory\"}],\"dbName\":null},\"HomeHero\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"mobileImageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"altText\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"linkUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"HomeCarouselSlide\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"mobileImageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"altText\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"subtitle\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"linkUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"sortOrder\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ProductVariant\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sku\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"compareAtPrice\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"leadTimeDays\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToProductVariant\"},{\"name\":\"inventory\",\"kind\":\"object\",\"type\":\"InventoryItem\",\"relationName\":\"InventoryItemToProductVariant\"},{\"name\":\"optionAssignments\",\"kind\":\"object\",\"type\":\"VariantOptionAssignment\",\"relationName\":\"ProductVariantToVariantOptionAssignment\"},{\"name\":\"bundleComponents\",\"kind\":\"object\",\"type\":\"BundleComponent\",\"relationName\":\"BundleAsParent\"},{\"name\":\"referencedInBundles\",\"kind\":\"object\",\"type\":\"BundleComponent\",\"relationName\":\"BundleAsChild\"},{\"name\":\"cartItems\",\"kind\":\"object\",\"type\":\"CartItem\",\"relationName\":\"CartItemToProductVariant\"},{\"name\":\"orderItems\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"OrderItemToProductVariant\"},{\"name\":\"receivingLines\",\"kind\":\"object\",\"type\":\"ReceivingLine\",\"relationName\":\"ProductVariantToReceivingLine\"},{\"name\":\"inventoryLots\",\"kind\":\"object\",\"type\":\"InventoryLot\",\"relationName\":\"InventoryLotToProductVariant\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"ProductVariantToStockMovement\"}],\"dbName\":null},\"InventoryItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"trackQuantity\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"quantityOnHand\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"quantityReserved\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"allowBackorder\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"reorderPoint\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"lowStockThreshold\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"InventoryItemToProductVariant\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"InventoryItemToStockMovement\"}],\"dbName\":null},\"ReceivingDocument\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"number\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"ReceivingDocumentStatus\"},{\"name\":\"reference\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"postedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"lines\",\"kind\":\"object\",\"type\":\"ReceivingLine\",\"relationName\":\"ReceivingDocumentToReceivingLine\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"ReceivingDocumentToStockMovement\"}],\"dbName\":null},\"ReceivingLine\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"receivingDocumentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unitCost\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"lotId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"position\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"receivingDocument\",\"kind\":\"object\",\"type\":\"ReceivingDocument\",\"relationName\":\"ReceivingDocumentToReceivingLine\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"ProductVariantToReceivingLine\"},{\"name\":\"lot\",\"kind\":\"object\",\"type\":\"InventoryLot\",\"relationName\":\"InventoryLotToReceivingLine\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"ReceivingLineToStockMovement\"}],\"dbName\":null},\"InventoryLot\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lotCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"receivedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"expiryDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"InventoryLotToProductVariant\"},{\"name\":\"receivingLines\",\"kind\":\"object\",\"type\":\"ReceivingLine\",\"relationName\":\"InventoryLotToReceivingLine\"},{\"name\":\"stockMovements\",\"kind\":\"object\",\"type\":\"StockMovement\",\"relationName\":\"InventoryLotToStockMovement\"}],\"dbName\":null},\"StockMovement\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"inventoryItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lotId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reason\",\"kind\":\"enum\",\"type\":\"StockMovementReason\"},{\"name\":\"quantityDelta\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sourceDocumentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sourceLineId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"ProductVariantToStockMovement\"},{\"name\":\"inventoryItem\",\"kind\":\"object\",\"type\":\"InventoryItem\",\"relationName\":\"InventoryItemToStockMovement\"},{\"name\":\"lot\",\"kind\":\"object\",\"type\":\"InventoryLot\",\"relationName\":\"InventoryLotToStockMovement\"},{\"name\":\"sourceDocument\",\"kind\":\"object\",\"type\":\"ReceivingDocument\",\"relationName\":\"ReceivingDocumentToStockMovement\"},{\"name\":\"sourceLine\",\"kind\":\"object\",\"type\":\"ReceivingLine\",\"relationName\":\"ReceivingLineToStockMovement\"}],\"dbName\":null},\"ProductOption\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"position\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToProductOption\"},{\"name\":\"values\",\"kind\":\"object\",\"type\":\"ProductOptionValue\",\"relationName\":\"ProductOptionToProductOptionValue\"}],\"dbName\":null},\"ProductOptionValue\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"optionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"value\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"position\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"option\",\"kind\":\"object\",\"type\":\"ProductOption\",\"relationName\":\"ProductOptionToProductOptionValue\"},{\"name\":\"assignments\",\"kind\":\"object\",\"type\":\"VariantOptionAssignment\",\"relationName\":\"ProductOptionValueToVariantOptionAssignment\"}],\"dbName\":null},\"VariantOptionAssignment\":{\"fields\":[{\"name\":\"variantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"optionValueId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"variant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"ProductVariantToVariantOptionAssignment\"},{\"name\":\"optionValue\",\"kind\":\"object\",\"type\":\"ProductOptionValue\",\"relationName\":\"ProductOptionValueToVariantOptionAssignment\"}],\"dbName\":null},\"ProductPersonalizationField\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"label\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"PersonalizationFieldType\"},{\"name\":\"required\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"position\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"placeholder\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"helpText\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"maxLength\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"priceDelta\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToProductPersonalizationField\"}],\"dbName\":null},\"BundleComponent\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"bundleVariantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"componentType\",\"kind\":\"enum\",\"type\":\"BundleComponentType\"},{\"name\":\"referencedVariantId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"unit\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sortOrder\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isOptional\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"bundleVariant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"BundleAsParent\"},{\"name\":\"referencedVariant\",\"kind\":\"object\",\"type\":\"ProductVariant\",\"relationName\":\"BundleAsChild\"}],\"dbName\":null},\"ProductImage\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"productId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"altText\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"position\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isCover\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"product\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"ProductToProductImage\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

