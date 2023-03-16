exports.bdauxilar = function hubsoft(query) {
    const mysql = require('mysql2');
    var config =
    {
        host: 'localhost',
        user: 'usuario',
        password: 'senha',
        database: 'games',
        port: 3306,
    };
    
    const conn = new mysql.createConnection(config);

    const custompromise = new Promise((resolve, reject) => {
        conn.connect(
            function (err) { 
            if (err) {     
                console.log("!!! Cannot connect !!! Error:");
                throw err;
                
            }
            else
            {
               conn.query(query, (err, res) => {
                var data
                if (!err) {
                    data = res
                    conn.end()
                    resolve(data)
                } else {
                    conn.end()
                    resolve(err.message)
                }
            })
            }
        });
    })
    return custompromise
}