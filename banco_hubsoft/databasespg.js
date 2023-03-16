exports.bdhub = function hubsoft(query) {

    const { Client } = require('pg')
    const client = new Client({
        host: 'ip_do_servidor',
        user: 'usuario',
        password: 'senha',
        port: '9432',
        database: 'hubsoft'

    })

    client.connect();

    const custompromise = new Promise((resolve, reject) => {
        var data
        client.query(query, (err, res) => {
            if (!err) {
                data = res.rows
                client.end()
                resolve(data)
            } else {
                client.end()
                resolve(err.message)
            }
        })
    })
    return custompromise


}
