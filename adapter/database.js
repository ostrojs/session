const fs = require('fs-extra')
const path = require('path')
const kConnection = Symbol('connection')
const kTable = Symbol('table')

class Database {
    constructor(connection, table) {
        this[kConnection] = connection;
        this[kTable] = table;
    }

    read(sid, cb) {
        this[kConnection].table(this[kTable]).where({ sid }).value('data').then(res => {
            cb(null, (res ? JSON.parse(res) : null))
        }).catch(err => {
            cb(err, null)
        })
    }

    write(sid, data, cb) {
        this[kConnection].table(this[kTable]).updateOrInsert({ sid }, { payload: JSON.stringify(data) }).then(res => {
            cb(null, res)
        }).catch(function(err) {
            cb(err, null)
        })
    }

    destroy(sid, cb) {
        this[kConnection].table(this[kTable]).where({ sid }).delete().then(res => {
            cb(null, true)
        }).catch(err => {
            cb(err, false)
        })
    }

}
module.exports = Database
