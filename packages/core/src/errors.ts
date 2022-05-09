export class UnknownDatabaseError extends Error {
  constructor(name: string) {
    super(`Unknown database '${name}'`)
  }
}

export class UnconnectedDatabaseError extends Error {
  constructor() {
    super('The database is not connected, please check the connection status between the machine and the database')
  }
}
