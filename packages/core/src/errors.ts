export class UnconnectedDatabaseError extends Error {
  constructor() {
    super('The database is not connected, please check the connection status between the machine and the database')
  }
}
