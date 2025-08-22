
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model OrderlyBroker
 * 
 */
export type OrderlyBroker = $Result.DefaultSelection<Prisma.$OrderlyBrokerPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more OrderlyBrokers
 * const orderlyBrokers = await prisma.orderlyBroker.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more OrderlyBrokers
   * const orderlyBrokers = await prisma.orderlyBroker.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.orderlyBroker`: Exposes CRUD operations for the **OrderlyBroker** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OrderlyBrokers
    * const orderlyBrokers = await prisma.orderlyBroker.findMany()
    * ```
    */
  get orderlyBroker(): Prisma.OrderlyBrokerDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.5.0
   * Query Engine version: 173f8d54f8d52e692c7e27e72a88314ec7aeff60
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    OrderlyBroker: 'OrderlyBroker'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "orderlyBroker"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      OrderlyBroker: {
        payload: Prisma.$OrderlyBrokerPayload<ExtArgs>
        fields: Prisma.OrderlyBrokerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderlyBrokerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderlyBrokerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          findFirst: {
            args: Prisma.OrderlyBrokerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderlyBrokerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          findMany: {
            args: Prisma.OrderlyBrokerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>[]
          }
          create: {
            args: Prisma.OrderlyBrokerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          createMany: {
            args: Prisma.OrderlyBrokerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.OrderlyBrokerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          update: {
            args: Prisma.OrderlyBrokerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          deleteMany: {
            args: Prisma.OrderlyBrokerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderlyBrokerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OrderlyBrokerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderlyBrokerPayload>
          }
          aggregate: {
            args: Prisma.OrderlyBrokerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrderlyBroker>
          }
          groupBy: {
            args: Prisma.OrderlyBrokerGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderlyBrokerGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderlyBrokerCountArgs<ExtArgs>
            result: $Utils.Optional<OrderlyBrokerCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    orderlyBroker?: OrderlyBrokerOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model OrderlyBroker
   */

  export type AggregateOrderlyBroker = {
    _count: OrderlyBrokerCountAggregateOutputType | null
    _avg: OrderlyBrokerAvgAggregateOutputType | null
    _sum: OrderlyBrokerSumAggregateOutputType | null
    _min: OrderlyBrokerMinAggregateOutputType | null
    _max: OrderlyBrokerMaxAggregateOutputType | null
  }

  export type OrderlyBrokerAvgAggregateOutputType = {
    id: number | null
    baseMakerFeeRate: Decimal | null
    baseTakerFeeRate: Decimal | null
    defaultMakerFeeRate: Decimal | null
    defaultTakerFeeRate: Decimal | null
    rebateCap: Decimal | null
  }

  export type OrderlyBrokerSumAggregateOutputType = {
    id: bigint | null
    baseMakerFeeRate: Decimal | null
    baseTakerFeeRate: Decimal | null
    defaultMakerFeeRate: Decimal | null
    defaultTakerFeeRate: Decimal | null
    rebateCap: Decimal | null
  }

  export type OrderlyBrokerMinAggregateOutputType = {
    id: bigint | null
    brokerId: string | null
    createdTime: Date | null
    updatedTime: Date | null
    brokerName: string | null
    brokerHash: string | null
    baseMakerFeeRate: Decimal | null
    baseTakerFeeRate: Decimal | null
    defaultMakerFeeRate: Decimal | null
    defaultTakerFeeRate: Decimal | null
    adminAccountId: string | null
    rebateCap: Decimal | null
    grossFeeEnable: boolean | null
    lockedRebateAllocation: boolean | null
    isAllSubsideTakerFee: boolean | null
  }

  export type OrderlyBrokerMaxAggregateOutputType = {
    id: bigint | null
    brokerId: string | null
    createdTime: Date | null
    updatedTime: Date | null
    brokerName: string | null
    brokerHash: string | null
    baseMakerFeeRate: Decimal | null
    baseTakerFeeRate: Decimal | null
    defaultMakerFeeRate: Decimal | null
    defaultTakerFeeRate: Decimal | null
    adminAccountId: string | null
    rebateCap: Decimal | null
    grossFeeEnable: boolean | null
    lockedRebateAllocation: boolean | null
    isAllSubsideTakerFee: boolean | null
  }

  export type OrderlyBrokerCountAggregateOutputType = {
    id: number
    brokerId: number
    createdTime: number
    updatedTime: number
    brokerName: number
    brokerHash: number
    baseMakerFeeRate: number
    baseTakerFeeRate: number
    defaultMakerFeeRate: number
    defaultTakerFeeRate: number
    adminAccountId: number
    rebateCap: number
    grossFeeEnable: number
    lockedRebateAllocation: number
    isAllSubsideTakerFee: number
    _all: number
  }


  export type OrderlyBrokerAvgAggregateInputType = {
    id?: true
    baseMakerFeeRate?: true
    baseTakerFeeRate?: true
    defaultMakerFeeRate?: true
    defaultTakerFeeRate?: true
    rebateCap?: true
  }

  export type OrderlyBrokerSumAggregateInputType = {
    id?: true
    baseMakerFeeRate?: true
    baseTakerFeeRate?: true
    defaultMakerFeeRate?: true
    defaultTakerFeeRate?: true
    rebateCap?: true
  }

  export type OrderlyBrokerMinAggregateInputType = {
    id?: true
    brokerId?: true
    createdTime?: true
    updatedTime?: true
    brokerName?: true
    brokerHash?: true
    baseMakerFeeRate?: true
    baseTakerFeeRate?: true
    defaultMakerFeeRate?: true
    defaultTakerFeeRate?: true
    adminAccountId?: true
    rebateCap?: true
    grossFeeEnable?: true
    lockedRebateAllocation?: true
    isAllSubsideTakerFee?: true
  }

  export type OrderlyBrokerMaxAggregateInputType = {
    id?: true
    brokerId?: true
    createdTime?: true
    updatedTime?: true
    brokerName?: true
    brokerHash?: true
    baseMakerFeeRate?: true
    baseTakerFeeRate?: true
    defaultMakerFeeRate?: true
    defaultTakerFeeRate?: true
    adminAccountId?: true
    rebateCap?: true
    grossFeeEnable?: true
    lockedRebateAllocation?: true
    isAllSubsideTakerFee?: true
  }

  export type OrderlyBrokerCountAggregateInputType = {
    id?: true
    brokerId?: true
    createdTime?: true
    updatedTime?: true
    brokerName?: true
    brokerHash?: true
    baseMakerFeeRate?: true
    baseTakerFeeRate?: true
    defaultMakerFeeRate?: true
    defaultTakerFeeRate?: true
    adminAccountId?: true
    rebateCap?: true
    grossFeeEnable?: true
    lockedRebateAllocation?: true
    isAllSubsideTakerFee?: true
    _all?: true
  }

  export type OrderlyBrokerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderlyBroker to aggregate.
     */
    where?: OrderlyBrokerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderlyBrokers to fetch.
     */
    orderBy?: OrderlyBrokerOrderByWithRelationInput | OrderlyBrokerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderlyBrokerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderlyBrokers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderlyBrokers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OrderlyBrokers
    **/
    _count?: true | OrderlyBrokerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrderlyBrokerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrderlyBrokerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderlyBrokerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderlyBrokerMaxAggregateInputType
  }

  export type GetOrderlyBrokerAggregateType<T extends OrderlyBrokerAggregateArgs> = {
        [P in keyof T & keyof AggregateOrderlyBroker]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrderlyBroker[P]>
      : GetScalarType<T[P], AggregateOrderlyBroker[P]>
  }




  export type OrderlyBrokerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderlyBrokerWhereInput
    orderBy?: OrderlyBrokerOrderByWithAggregationInput | OrderlyBrokerOrderByWithAggregationInput[]
    by: OrderlyBrokerScalarFieldEnum[] | OrderlyBrokerScalarFieldEnum
    having?: OrderlyBrokerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderlyBrokerCountAggregateInputType | true
    _avg?: OrderlyBrokerAvgAggregateInputType
    _sum?: OrderlyBrokerSumAggregateInputType
    _min?: OrderlyBrokerMinAggregateInputType
    _max?: OrderlyBrokerMaxAggregateInputType
  }

  export type OrderlyBrokerGroupByOutputType = {
    id: bigint
    brokerId: string
    createdTime: Date
    updatedTime: Date
    brokerName: string
    brokerHash: string
    baseMakerFeeRate: Decimal
    baseTakerFeeRate: Decimal
    defaultMakerFeeRate: Decimal
    defaultTakerFeeRate: Decimal
    adminAccountId: string | null
    rebateCap: Decimal
    grossFeeEnable: boolean
    lockedRebateAllocation: boolean
    isAllSubsideTakerFee: boolean
    _count: OrderlyBrokerCountAggregateOutputType | null
    _avg: OrderlyBrokerAvgAggregateOutputType | null
    _sum: OrderlyBrokerSumAggregateOutputType | null
    _min: OrderlyBrokerMinAggregateOutputType | null
    _max: OrderlyBrokerMaxAggregateOutputType | null
  }

  type GetOrderlyBrokerGroupByPayload<T extends OrderlyBrokerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderlyBrokerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderlyBrokerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderlyBrokerGroupByOutputType[P]>
            : GetScalarType<T[P], OrderlyBrokerGroupByOutputType[P]>
        }
      >
    >


  export type OrderlyBrokerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    brokerId?: boolean
    createdTime?: boolean
    updatedTime?: boolean
    brokerName?: boolean
    brokerHash?: boolean
    baseMakerFeeRate?: boolean
    baseTakerFeeRate?: boolean
    defaultMakerFeeRate?: boolean
    defaultTakerFeeRate?: boolean
    adminAccountId?: boolean
    rebateCap?: boolean
    grossFeeEnable?: boolean
    lockedRebateAllocation?: boolean
    isAllSubsideTakerFee?: boolean
  }, ExtArgs["result"]["orderlyBroker"]>



  export type OrderlyBrokerSelectScalar = {
    id?: boolean
    brokerId?: boolean
    createdTime?: boolean
    updatedTime?: boolean
    brokerName?: boolean
    brokerHash?: boolean
    baseMakerFeeRate?: boolean
    baseTakerFeeRate?: boolean
    defaultMakerFeeRate?: boolean
    defaultTakerFeeRate?: boolean
    adminAccountId?: boolean
    rebateCap?: boolean
    grossFeeEnable?: boolean
    lockedRebateAllocation?: boolean
    isAllSubsideTakerFee?: boolean
  }

  export type OrderlyBrokerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "brokerId" | "createdTime" | "updatedTime" | "brokerName" | "brokerHash" | "baseMakerFeeRate" | "baseTakerFeeRate" | "defaultMakerFeeRate" | "defaultTakerFeeRate" | "adminAccountId" | "rebateCap" | "grossFeeEnable" | "lockedRebateAllocation" | "isAllSubsideTakerFee", ExtArgs["result"]["orderlyBroker"]>

  export type $OrderlyBrokerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OrderlyBroker"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      brokerId: string
      createdTime: Date
      updatedTime: Date
      brokerName: string
      brokerHash: string
      baseMakerFeeRate: Prisma.Decimal
      baseTakerFeeRate: Prisma.Decimal
      defaultMakerFeeRate: Prisma.Decimal
      defaultTakerFeeRate: Prisma.Decimal
      adminAccountId: string | null
      rebateCap: Prisma.Decimal
      grossFeeEnable: boolean
      lockedRebateAllocation: boolean
      isAllSubsideTakerFee: boolean
    }, ExtArgs["result"]["orderlyBroker"]>
    composites: {}
  }

  type OrderlyBrokerGetPayload<S extends boolean | null | undefined | OrderlyBrokerDefaultArgs> = $Result.GetResult<Prisma.$OrderlyBrokerPayload, S>

  type OrderlyBrokerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrderlyBrokerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrderlyBrokerCountAggregateInputType | true
    }

  export interface OrderlyBrokerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OrderlyBroker'], meta: { name: 'OrderlyBroker' } }
    /**
     * Find zero or one OrderlyBroker that matches the filter.
     * @param {OrderlyBrokerFindUniqueArgs} args - Arguments to find a OrderlyBroker
     * @example
     * // Get one OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderlyBrokerFindUniqueArgs>(args: SelectSubset<T, OrderlyBrokerFindUniqueArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OrderlyBroker that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrderlyBrokerFindUniqueOrThrowArgs} args - Arguments to find a OrderlyBroker
     * @example
     * // Get one OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderlyBrokerFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderlyBrokerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrderlyBroker that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerFindFirstArgs} args - Arguments to find a OrderlyBroker
     * @example
     * // Get one OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderlyBrokerFindFirstArgs>(args?: SelectSubset<T, OrderlyBrokerFindFirstArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrderlyBroker that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerFindFirstOrThrowArgs} args - Arguments to find a OrderlyBroker
     * @example
     * // Get one OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderlyBrokerFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderlyBrokerFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OrderlyBrokers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OrderlyBrokers
     * const orderlyBrokers = await prisma.orderlyBroker.findMany()
     * 
     * // Get first 10 OrderlyBrokers
     * const orderlyBrokers = await prisma.orderlyBroker.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderlyBrokerWithIdOnly = await prisma.orderlyBroker.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderlyBrokerFindManyArgs>(args?: SelectSubset<T, OrderlyBrokerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OrderlyBroker.
     * @param {OrderlyBrokerCreateArgs} args - Arguments to create a OrderlyBroker.
     * @example
     * // Create one OrderlyBroker
     * const OrderlyBroker = await prisma.orderlyBroker.create({
     *   data: {
     *     // ... data to create a OrderlyBroker
     *   }
     * })
     * 
     */
    create<T extends OrderlyBrokerCreateArgs>(args: SelectSubset<T, OrderlyBrokerCreateArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OrderlyBrokers.
     * @param {OrderlyBrokerCreateManyArgs} args - Arguments to create many OrderlyBrokers.
     * @example
     * // Create many OrderlyBrokers
     * const orderlyBroker = await prisma.orderlyBroker.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderlyBrokerCreateManyArgs>(args?: SelectSubset<T, OrderlyBrokerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a OrderlyBroker.
     * @param {OrderlyBrokerDeleteArgs} args - Arguments to delete one OrderlyBroker.
     * @example
     * // Delete one OrderlyBroker
     * const OrderlyBroker = await prisma.orderlyBroker.delete({
     *   where: {
     *     // ... filter to delete one OrderlyBroker
     *   }
     * })
     * 
     */
    delete<T extends OrderlyBrokerDeleteArgs>(args: SelectSubset<T, OrderlyBrokerDeleteArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OrderlyBroker.
     * @param {OrderlyBrokerUpdateArgs} args - Arguments to update one OrderlyBroker.
     * @example
     * // Update one OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderlyBrokerUpdateArgs>(args: SelectSubset<T, OrderlyBrokerUpdateArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OrderlyBrokers.
     * @param {OrderlyBrokerDeleteManyArgs} args - Arguments to filter OrderlyBrokers to delete.
     * @example
     * // Delete a few OrderlyBrokers
     * const { count } = await prisma.orderlyBroker.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderlyBrokerDeleteManyArgs>(args?: SelectSubset<T, OrderlyBrokerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrderlyBrokers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OrderlyBrokers
     * const orderlyBroker = await prisma.orderlyBroker.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderlyBrokerUpdateManyArgs>(args: SelectSubset<T, OrderlyBrokerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one OrderlyBroker.
     * @param {OrderlyBrokerUpsertArgs} args - Arguments to update or create a OrderlyBroker.
     * @example
     * // Update or create a OrderlyBroker
     * const orderlyBroker = await prisma.orderlyBroker.upsert({
     *   create: {
     *     // ... data to create a OrderlyBroker
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OrderlyBroker we want to update
     *   }
     * })
     */
    upsert<T extends OrderlyBrokerUpsertArgs>(args: SelectSubset<T, OrderlyBrokerUpsertArgs<ExtArgs>>): Prisma__OrderlyBrokerClient<$Result.GetResult<Prisma.$OrderlyBrokerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OrderlyBrokers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerCountArgs} args - Arguments to filter OrderlyBrokers to count.
     * @example
     * // Count the number of OrderlyBrokers
     * const count = await prisma.orderlyBroker.count({
     *   where: {
     *     // ... the filter for the OrderlyBrokers we want to count
     *   }
     * })
    **/
    count<T extends OrderlyBrokerCountArgs>(
      args?: Subset<T, OrderlyBrokerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderlyBrokerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OrderlyBroker.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderlyBrokerAggregateArgs>(args: Subset<T, OrderlyBrokerAggregateArgs>): Prisma.PrismaPromise<GetOrderlyBrokerAggregateType<T>>

    /**
     * Group by OrderlyBroker.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderlyBrokerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderlyBrokerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderlyBrokerGroupByArgs['orderBy'] }
        : { orderBy?: OrderlyBrokerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderlyBrokerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderlyBrokerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OrderlyBroker model
   */
  readonly fields: OrderlyBrokerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OrderlyBroker.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderlyBrokerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OrderlyBroker model
   */ 
  interface OrderlyBrokerFieldRefs {
    readonly id: FieldRef<"OrderlyBroker", 'BigInt'>
    readonly brokerId: FieldRef<"OrderlyBroker", 'String'>
    readonly createdTime: FieldRef<"OrderlyBroker", 'DateTime'>
    readonly updatedTime: FieldRef<"OrderlyBroker", 'DateTime'>
    readonly brokerName: FieldRef<"OrderlyBroker", 'String'>
    readonly brokerHash: FieldRef<"OrderlyBroker", 'String'>
    readonly baseMakerFeeRate: FieldRef<"OrderlyBroker", 'Decimal'>
    readonly baseTakerFeeRate: FieldRef<"OrderlyBroker", 'Decimal'>
    readonly defaultMakerFeeRate: FieldRef<"OrderlyBroker", 'Decimal'>
    readonly defaultTakerFeeRate: FieldRef<"OrderlyBroker", 'Decimal'>
    readonly adminAccountId: FieldRef<"OrderlyBroker", 'String'>
    readonly rebateCap: FieldRef<"OrderlyBroker", 'Decimal'>
    readonly grossFeeEnable: FieldRef<"OrderlyBroker", 'Boolean'>
    readonly lockedRebateAllocation: FieldRef<"OrderlyBroker", 'Boolean'>
    readonly isAllSubsideTakerFee: FieldRef<"OrderlyBroker", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * OrderlyBroker findUnique
   */
  export type OrderlyBrokerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter, which OrderlyBroker to fetch.
     */
    where: OrderlyBrokerWhereUniqueInput
  }

  /**
   * OrderlyBroker findUniqueOrThrow
   */
  export type OrderlyBrokerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter, which OrderlyBroker to fetch.
     */
    where: OrderlyBrokerWhereUniqueInput
  }

  /**
   * OrderlyBroker findFirst
   */
  export type OrderlyBrokerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter, which OrderlyBroker to fetch.
     */
    where?: OrderlyBrokerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderlyBrokers to fetch.
     */
    orderBy?: OrderlyBrokerOrderByWithRelationInput | OrderlyBrokerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderlyBrokers.
     */
    cursor?: OrderlyBrokerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderlyBrokers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderlyBrokers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderlyBrokers.
     */
    distinct?: OrderlyBrokerScalarFieldEnum | OrderlyBrokerScalarFieldEnum[]
  }

  /**
   * OrderlyBroker findFirstOrThrow
   */
  export type OrderlyBrokerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter, which OrderlyBroker to fetch.
     */
    where?: OrderlyBrokerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderlyBrokers to fetch.
     */
    orderBy?: OrderlyBrokerOrderByWithRelationInput | OrderlyBrokerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderlyBrokers.
     */
    cursor?: OrderlyBrokerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderlyBrokers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderlyBrokers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderlyBrokers.
     */
    distinct?: OrderlyBrokerScalarFieldEnum | OrderlyBrokerScalarFieldEnum[]
  }

  /**
   * OrderlyBroker findMany
   */
  export type OrderlyBrokerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter, which OrderlyBrokers to fetch.
     */
    where?: OrderlyBrokerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderlyBrokers to fetch.
     */
    orderBy?: OrderlyBrokerOrderByWithRelationInput | OrderlyBrokerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OrderlyBrokers.
     */
    cursor?: OrderlyBrokerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderlyBrokers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderlyBrokers.
     */
    skip?: number
    distinct?: OrderlyBrokerScalarFieldEnum | OrderlyBrokerScalarFieldEnum[]
  }

  /**
   * OrderlyBroker create
   */
  export type OrderlyBrokerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * The data needed to create a OrderlyBroker.
     */
    data: XOR<OrderlyBrokerCreateInput, OrderlyBrokerUncheckedCreateInput>
  }

  /**
   * OrderlyBroker createMany
   */
  export type OrderlyBrokerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OrderlyBrokers.
     */
    data: OrderlyBrokerCreateManyInput | OrderlyBrokerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrderlyBroker update
   */
  export type OrderlyBrokerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * The data needed to update a OrderlyBroker.
     */
    data: XOR<OrderlyBrokerUpdateInput, OrderlyBrokerUncheckedUpdateInput>
    /**
     * Choose, which OrderlyBroker to update.
     */
    where: OrderlyBrokerWhereUniqueInput
  }

  /**
   * OrderlyBroker updateMany
   */
  export type OrderlyBrokerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OrderlyBrokers.
     */
    data: XOR<OrderlyBrokerUpdateManyMutationInput, OrderlyBrokerUncheckedUpdateManyInput>
    /**
     * Filter which OrderlyBrokers to update
     */
    where?: OrderlyBrokerWhereInput
    /**
     * Limit how many OrderlyBrokers to update.
     */
    limit?: number
  }

  /**
   * OrderlyBroker upsert
   */
  export type OrderlyBrokerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * The filter to search for the OrderlyBroker to update in case it exists.
     */
    where: OrderlyBrokerWhereUniqueInput
    /**
     * In case the OrderlyBroker found by the `where` argument doesn't exist, create a new OrderlyBroker with this data.
     */
    create: XOR<OrderlyBrokerCreateInput, OrderlyBrokerUncheckedCreateInput>
    /**
     * In case the OrderlyBroker was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderlyBrokerUpdateInput, OrderlyBrokerUncheckedUpdateInput>
  }

  /**
   * OrderlyBroker delete
   */
  export type OrderlyBrokerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
    /**
     * Filter which OrderlyBroker to delete.
     */
    where: OrderlyBrokerWhereUniqueInput
  }

  /**
   * OrderlyBroker deleteMany
   */
  export type OrderlyBrokerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderlyBrokers to delete
     */
    where?: OrderlyBrokerWhereInput
    /**
     * Limit how many OrderlyBrokers to delete.
     */
    limit?: number
  }

  /**
   * OrderlyBroker without action
   */
  export type OrderlyBrokerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderlyBroker
     */
    select?: OrderlyBrokerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderlyBroker
     */
    omit?: OrderlyBrokerOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const OrderlyBrokerScalarFieldEnum: {
    id: 'id',
    brokerId: 'brokerId',
    createdTime: 'createdTime',
    updatedTime: 'updatedTime',
    brokerName: 'brokerName',
    brokerHash: 'brokerHash',
    baseMakerFeeRate: 'baseMakerFeeRate',
    baseTakerFeeRate: 'baseTakerFeeRate',
    defaultMakerFeeRate: 'defaultMakerFeeRate',
    defaultTakerFeeRate: 'defaultTakerFeeRate',
    adminAccountId: 'adminAccountId',
    rebateCap: 'rebateCap',
    grossFeeEnable: 'grossFeeEnable',
    lockedRebateAllocation: 'lockedRebateAllocation',
    isAllSubsideTakerFee: 'isAllSubsideTakerFee'
  };

  export type OrderlyBrokerScalarFieldEnum = (typeof OrderlyBrokerScalarFieldEnum)[keyof typeof OrderlyBrokerScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const OrderlyBrokerOrderByRelevanceFieldEnum: {
    brokerId: 'brokerId',
    brokerName: 'brokerName',
    brokerHash: 'brokerHash',
    adminAccountId: 'adminAccountId'
  };

  export type OrderlyBrokerOrderByRelevanceFieldEnum = (typeof OrderlyBrokerOrderByRelevanceFieldEnum)[keyof typeof OrderlyBrokerOrderByRelevanceFieldEnum]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type OrderlyBrokerWhereInput = {
    AND?: OrderlyBrokerWhereInput | OrderlyBrokerWhereInput[]
    OR?: OrderlyBrokerWhereInput[]
    NOT?: OrderlyBrokerWhereInput | OrderlyBrokerWhereInput[]
    id?: BigIntFilter<"OrderlyBroker"> | bigint | number
    brokerId?: StringFilter<"OrderlyBroker"> | string
    createdTime?: DateTimeFilter<"OrderlyBroker"> | Date | string
    updatedTime?: DateTimeFilter<"OrderlyBroker"> | Date | string
    brokerName?: StringFilter<"OrderlyBroker"> | string
    brokerHash?: StringFilter<"OrderlyBroker"> | string
    baseMakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    adminAccountId?: StringNullableFilter<"OrderlyBroker"> | string | null
    rebateCap?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFilter<"OrderlyBroker"> | boolean
    lockedRebateAllocation?: BoolFilter<"OrderlyBroker"> | boolean
    isAllSubsideTakerFee?: BoolFilter<"OrderlyBroker"> | boolean
  }

  export type OrderlyBrokerOrderByWithRelationInput = {
    id?: SortOrder
    brokerId?: SortOrder
    createdTime?: SortOrder
    updatedTime?: SortOrder
    brokerName?: SortOrder
    brokerHash?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    adminAccountId?: SortOrderInput | SortOrder
    rebateCap?: SortOrder
    grossFeeEnable?: SortOrder
    lockedRebateAllocation?: SortOrder
    isAllSubsideTakerFee?: SortOrder
    _relevance?: OrderlyBrokerOrderByRelevanceInput
  }

  export type OrderlyBrokerWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    brokerId?: string
    brokerHash?: string
    AND?: OrderlyBrokerWhereInput | OrderlyBrokerWhereInput[]
    OR?: OrderlyBrokerWhereInput[]
    NOT?: OrderlyBrokerWhereInput | OrderlyBrokerWhereInput[]
    createdTime?: DateTimeFilter<"OrderlyBroker"> | Date | string
    updatedTime?: DateTimeFilter<"OrderlyBroker"> | Date | string
    brokerName?: StringFilter<"OrderlyBroker"> | string
    baseMakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    adminAccountId?: StringNullableFilter<"OrderlyBroker"> | string | null
    rebateCap?: DecimalFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFilter<"OrderlyBroker"> | boolean
    lockedRebateAllocation?: BoolFilter<"OrderlyBroker"> | boolean
    isAllSubsideTakerFee?: BoolFilter<"OrderlyBroker"> | boolean
  }, "id" | "brokerId" | "brokerHash">

  export type OrderlyBrokerOrderByWithAggregationInput = {
    id?: SortOrder
    brokerId?: SortOrder
    createdTime?: SortOrder
    updatedTime?: SortOrder
    brokerName?: SortOrder
    brokerHash?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    adminAccountId?: SortOrderInput | SortOrder
    rebateCap?: SortOrder
    grossFeeEnable?: SortOrder
    lockedRebateAllocation?: SortOrder
    isAllSubsideTakerFee?: SortOrder
    _count?: OrderlyBrokerCountOrderByAggregateInput
    _avg?: OrderlyBrokerAvgOrderByAggregateInput
    _max?: OrderlyBrokerMaxOrderByAggregateInput
    _min?: OrderlyBrokerMinOrderByAggregateInput
    _sum?: OrderlyBrokerSumOrderByAggregateInput
  }

  export type OrderlyBrokerScalarWhereWithAggregatesInput = {
    AND?: OrderlyBrokerScalarWhereWithAggregatesInput | OrderlyBrokerScalarWhereWithAggregatesInput[]
    OR?: OrderlyBrokerScalarWhereWithAggregatesInput[]
    NOT?: OrderlyBrokerScalarWhereWithAggregatesInput | OrderlyBrokerScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"OrderlyBroker"> | bigint | number
    brokerId?: StringWithAggregatesFilter<"OrderlyBroker"> | string
    createdTime?: DateTimeWithAggregatesFilter<"OrderlyBroker"> | Date | string
    updatedTime?: DateTimeWithAggregatesFilter<"OrderlyBroker"> | Date | string
    brokerName?: StringWithAggregatesFilter<"OrderlyBroker"> | string
    brokerHash?: StringWithAggregatesFilter<"OrderlyBroker"> | string
    baseMakerFeeRate?: DecimalWithAggregatesFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalWithAggregatesFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalWithAggregatesFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalWithAggregatesFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    adminAccountId?: StringNullableWithAggregatesFilter<"OrderlyBroker"> | string | null
    rebateCap?: DecimalWithAggregatesFilter<"OrderlyBroker"> | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolWithAggregatesFilter<"OrderlyBroker"> | boolean
    lockedRebateAllocation?: BoolWithAggregatesFilter<"OrderlyBroker"> | boolean
    isAllSubsideTakerFee?: BoolWithAggregatesFilter<"OrderlyBroker"> | boolean
  }

  export type OrderlyBrokerCreateInput = {
    id?: bigint | number
    brokerId: string
    createdTime?: Date | string
    updatedTime?: Date | string
    brokerName: string
    brokerHash?: string
    baseMakerFeeRate?: Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: Decimal | DecimalJsLike | number | string
    adminAccountId?: string | null
    rebateCap?: Decimal | DecimalJsLike | number | string
    grossFeeEnable?: boolean
    lockedRebateAllocation?: boolean
    isAllSubsideTakerFee?: boolean
  }

  export type OrderlyBrokerUncheckedCreateInput = {
    id?: bigint | number
    brokerId: string
    createdTime?: Date | string
    updatedTime?: Date | string
    brokerName: string
    brokerHash?: string
    baseMakerFeeRate?: Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: Decimal | DecimalJsLike | number | string
    adminAccountId?: string | null
    rebateCap?: Decimal | DecimalJsLike | number | string
    grossFeeEnable?: boolean
    lockedRebateAllocation?: boolean
    isAllSubsideTakerFee?: boolean
  }

  export type OrderlyBrokerUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    brokerId?: StringFieldUpdateOperationsInput | string
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string
    brokerName?: StringFieldUpdateOperationsInput | string
    brokerHash?: StringFieldUpdateOperationsInput | string
    baseMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    adminAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    rebateCap?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFieldUpdateOperationsInput | boolean
    lockedRebateAllocation?: BoolFieldUpdateOperationsInput | boolean
    isAllSubsideTakerFee?: BoolFieldUpdateOperationsInput | boolean
  }

  export type OrderlyBrokerUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    brokerId?: StringFieldUpdateOperationsInput | string
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string
    brokerName?: StringFieldUpdateOperationsInput | string
    brokerHash?: StringFieldUpdateOperationsInput | string
    baseMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    adminAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    rebateCap?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFieldUpdateOperationsInput | boolean
    lockedRebateAllocation?: BoolFieldUpdateOperationsInput | boolean
    isAllSubsideTakerFee?: BoolFieldUpdateOperationsInput | boolean
  }

  export type OrderlyBrokerCreateManyInput = {
    id?: bigint | number
    brokerId: string
    createdTime?: Date | string
    updatedTime?: Date | string
    brokerName: string
    brokerHash?: string
    baseMakerFeeRate?: Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: Decimal | DecimalJsLike | number | string
    adminAccountId?: string | null
    rebateCap?: Decimal | DecimalJsLike | number | string
    grossFeeEnable?: boolean
    lockedRebateAllocation?: boolean
    isAllSubsideTakerFee?: boolean
  }

  export type OrderlyBrokerUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    brokerId?: StringFieldUpdateOperationsInput | string
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string
    brokerName?: StringFieldUpdateOperationsInput | string
    brokerHash?: StringFieldUpdateOperationsInput | string
    baseMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    adminAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    rebateCap?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFieldUpdateOperationsInput | boolean
    lockedRebateAllocation?: BoolFieldUpdateOperationsInput | boolean
    isAllSubsideTakerFee?: BoolFieldUpdateOperationsInput | boolean
  }

  export type OrderlyBrokerUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    brokerId?: StringFieldUpdateOperationsInput | string
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string
    brokerName?: StringFieldUpdateOperationsInput | string
    brokerHash?: StringFieldUpdateOperationsInput | string
    baseMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    baseTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultMakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    defaultTakerFeeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    adminAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    rebateCap?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    grossFeeEnable?: BoolFieldUpdateOperationsInput | boolean
    lockedRebateAllocation?: BoolFieldUpdateOperationsInput | boolean
    isAllSubsideTakerFee?: BoolFieldUpdateOperationsInput | boolean
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type OrderlyBrokerOrderByRelevanceInput = {
    fields: OrderlyBrokerOrderByRelevanceFieldEnum | OrderlyBrokerOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type OrderlyBrokerCountOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    createdTime?: SortOrder
    updatedTime?: SortOrder
    brokerName?: SortOrder
    brokerHash?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    adminAccountId?: SortOrder
    rebateCap?: SortOrder
    grossFeeEnable?: SortOrder
    lockedRebateAllocation?: SortOrder
    isAllSubsideTakerFee?: SortOrder
  }

  export type OrderlyBrokerAvgOrderByAggregateInput = {
    id?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    rebateCap?: SortOrder
  }

  export type OrderlyBrokerMaxOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    createdTime?: SortOrder
    updatedTime?: SortOrder
    brokerName?: SortOrder
    brokerHash?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    adminAccountId?: SortOrder
    rebateCap?: SortOrder
    grossFeeEnable?: SortOrder
    lockedRebateAllocation?: SortOrder
    isAllSubsideTakerFee?: SortOrder
  }

  export type OrderlyBrokerMinOrderByAggregateInput = {
    id?: SortOrder
    brokerId?: SortOrder
    createdTime?: SortOrder
    updatedTime?: SortOrder
    brokerName?: SortOrder
    brokerHash?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    adminAccountId?: SortOrder
    rebateCap?: SortOrder
    grossFeeEnable?: SortOrder
    lockedRebateAllocation?: SortOrder
    isAllSubsideTakerFee?: SortOrder
  }

  export type OrderlyBrokerSumOrderByAggregateInput = {
    id?: SortOrder
    baseMakerFeeRate?: SortOrder
    baseTakerFeeRate?: SortOrder
    defaultMakerFeeRate?: SortOrder
    defaultTakerFeeRate?: SortOrder
    rebateCap?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[]
    notIn?: bigint[] | number[]
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}