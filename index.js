const conectbd = require('./banco_hubsoft/databasespg')
const conetbdmysql = require('./banco_pontos/databasesmysql')
const date = new Date()
const mes = date.getMonth() + 1
const data = date.getFullYear() + '-' + mes + '-' + date.getDate()

function avaliacao_cliente() {

    // Consulta de avaliação por media por dia do técnico
    const query_avaliacao = `SELECT u.id, u.name, AVG(av.avaliacao) as media, COUNT(av.avaliacao) as qtde_avaliacoes
    FROM atendimento_avaliacao av 
    JOIN atendimento_avaliacao_usuario avu ON av.id_atendimento_avaliacao = avu.id_atendimento_avaliacao
    JOIN atendimento a ON a.id_atendimento = av.id_atendimento
    JOIN users u ON u.id = avu.id_usuario
    WHERE tipo_avaliacao = 'tecnicos'
    AND date(av.created_at) >= CURRENT_DATE
    GROUP BY u.id
    ORDER BY AVG(av.avaliacao) DESC`

    conectbd.bdhub(query_avaliacao).then(data => {
        if (data.length > 0) {
            for (i = 0; i < data.length; i++) {
                var id_user = data[i].id
                var media = data[i].media
                if (media >= 9) {
                    Insert_pontos_positivos(id_user)
                } if (media <= 6) {
                    Insert_pontos_negativos(id_user)
                }
            }
        }


    })
        .catch(err => {
            console.log(err)
        })
    setTimeout(() => {
        os_nivel_2_dupla()
    }, 700)
}

async function Quantidade_os_nivel_1() {
    // Consulta de quantidade de o.s de nivel 1
    // *id_tipo_ordem_servico in ('5','61','7','15','62')* deve ser alterado no select abaixo pelos os id do tipo de ordem de serviço que voce considera
    // como o.s de nivel 1 "o.s que não utiliza escada",
    const query_quantidade_os_nivel_1 = `    select u.id,  u.name, count(os.id_ordem_servico) as quantidade_os from atendimento a
    join ordem_servico os on os.id_atendimento = a.id_atendimento
    join ordem_servico_tecnico ost on ost.id_ordem_servico = os.id_ordem_servico
    join users u on ost.id_usuario = u.id
    where os.data_termino_executado >= current_date and
    os.id_tipo_ordem_servico in ('5','61','7','15','62') and os.status = 'finalizado'
    group by u.id
    order by quantidade_os desc`
    await conectbd.bdhub(query_quantidade_os_nivel_1).then(data => {
        for (i = 0; i < data.length; i++) {
            var id_user = data[i].id
            var quantidade_os = data[i].quantidade_os
            Insert_pontos_positivos_nivel1(id_user, quantidade_os)
        }

    })
        .catch(err => {
            console.log(err)
        })
    Quantidade_os_nivel_2()
}

async function Quantidade_os_nivel_2() {
    // Consulta de quantidade de o.s de nivel 2
    // *id_tipo_ordem_servico in ('52','30','6','4','63','11','32','31','53','14')* deve ser alterado pelos os id do tipo de ordem de serviço que voce considera
    // como o.s de nivel 1 "o.s que utiliza escada"
    const query_quantidade_os_nivel_2 = `select u.id,  u.name, count(os.id_ordem_servico) as quantidade_os from atendimento a
    join ordem_servico os on os.id_atendimento = a.id_atendimento
    join ordem_servico_tecnico ost on os.id_ordem_servico = ost.id_ordem_servico
    join users u on ost.id_usuario = u.id
    where os.data_termino_executado >= current_date and
    os.id_tipo_ordem_servico in ('52','30','6','4','63','11','32','31','53','14')
    and os.status = 'finalizado' and u.id not in ('209')
    group by u.id
    order by quantidade_os desc`
    await conectbd.bdhub(query_quantidade_os_nivel_2).then(data => {
        for (i = 0; i < data.length; i++) {
            var id_user = data[i].id
            var quantidade_os = data[i].quantidade_os
            Insert_pontos_positivos_nivel2(id_user, quantidade_os)
        }

    })
        .catch(err => {
            console.log(err)
        })
    avaliacao_cliente()
}

async function select_user_hubsoft() {
    //Consulta usuarios hubsoft
    /* *users.id not in ('77','168','209','96','25','9','32','93','37', '237', '141', '145', '272','90','194','232')*
    deve ser trocado pelo os id dos usuarios que NÃO deve ser participantes
    */
    const query_users_hub = `select id, name from users where users.ativo = true and users.tecnico = true and users.id not in 
    ('77','168','209','96','25','9','32','93','37', '237', '141', '145', '272','90','194','232')
    order by name `
    await conectbd.bdhub(query_users_hub).then(data => {
        for (i = 0; i < data.length; i++) {
            var id_user = data[i].id
            var name = data[i].name
            select_users_bd_apoio(id_user, name)
        }

    })
        .catch(err => {
            console.log(err)
        })
    select_cliente_reincidente_hubsoft()
}

async function select_cliente_reincidente_hubsoft() {
    // Consulta cliente clientes reincidentes nos ultimos 30 dias
    // Na parte de descrição do tipo de ordem de serviço deve ser trocaado pelas as descrições "nome" que deve considera que é o.s reincidente
    const query_cliente_reincidente_ultimos_30d = `SELECT "source"."cliente__nome_razaosocial" AS "cliente__nome_razaosocial", "source"."cliente_servico - id_cliente_servico__id_cliente_servico" AS "id_cliente_servico", "source"."count" AS "count"
FROM (SELECT "cliente"."nome_razaosocial" AS "cliente__nome_razaosocial", "cliente_servico - id_cliente_servico"."id_cliente_servico" AS "cliente_servico - id_cliente_servico__id_cliente_servico", count(*) AS "count" FROM "public"."atendimento"
LEFT JOIN "public"."cliente_servico" "cliente_servico - id_cliente_servico" ON "public"."atendimento"."id_cliente_servico" = "cliente_servico - id_cliente_servico"."id_cliente_servico" LEFT JOIN "public"."cliente" "cliente" ON "cliente_servico - id_cliente_servico"."id_cliente" = "cliente"."id_cliente" LEFT JOIN "public"."ordem_servico" "ordem_servico" ON "public"."atendimento"."id_atendimento" = "ordem_servico"."id_atendimento" LEFT JOIN "public"."tipo_ordem_servico" "tipo_ordem_servico" ON "ordem_servico"."id_tipo_ordem_servico" = "tipo_ordem_servico"."id_tipo_ordem_servico"
WHERE ("ordem_servico"."data_termino_executado" >= CAST((CAST(now() AS timestamp) + (INTERVAL '-30 day')) AS date)
   AND "ordem_servico"."data_termino_executado" < CAST(now() AS date) AND ("tipo_ordem_servico"."descricao" = 'REDE INTERNA'
    OR "tipo_ordem_servico"."descricao" = 'REPARO NÍVEL 01' OR "tipo_ordem_servico"."descricao" = 'SUBSTITUIÇÃO DO CABO' 
    OR "tipo_ordem_servico"."descricao" = 'SUPORTE  NIVEL 1' OR "tipo_ordem_servico"."descricao" = 'SUPORTE NIVEL 02' 
    OR "tipo_ordem_servico"."descricao" = 'TRANSF. DE NÍVEIS 1>2'))
GROUP BY "cliente"."nome_razaosocial", "cliente_servico - id_cliente_servico"."id_cliente_servico"
ORDER BY "cliente"."nome_razaosocial" ASC, "cliente_servico - id_cliente_servico"."id_cliente_servico" ASC) "source" WHERE ("source"."count" >= 2 AND ("source"."cliente__nome_razaosocial" <> 'PORTAL NETWORK' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'TUX NET - SERVIÇOS DE INFORMÁTICA EIRELI' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'ELEICAO 2020 LUCAS WILLIAN DA SILVA SANTOS PREFEITO' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'ELEIÇÃO 2020 JOSE RAMIRO FERREIRA FILHO PREFEITO' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE AMÉLIA RODRIGUES' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE ANGUERA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE ICHU - SEDE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE RETIROLÂNDIA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE RIACHÃO DO JACUÍPE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE SANTA LUZ' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA MUNICIPAL DE VALENTE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'PREFEITURA NOVA FATIMA - MATRIZ' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO ESTADUAL DE SAUDE DO ESTADO DA BAHIA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE ASSISTENCIA SOCIAL' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL DE ANGUERA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL DE ICHU' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE EDUCACAO' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE EDUCAÇÃO DE ICHU - FUMEI' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE EDUCAÇÃO DE RIACHÃO DO JACUÍPE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE SAUDE DE VALENTE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE SAÚDE DE ANGUERA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE SAÚDE DE ICHU' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'FUNDO MUNICIPAL DE SAÚDE DE RIACHÃO DO JACUÍPE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'BAHIA SECRETARIA DA SEGURANCA PUBLICA -(POLICIA MILITAR)' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DA ADMINISTRAÇÃO DO ESTADO DA BAHIA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DA FAZENDA DO ESTADO DA BAHIA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DA SEGURANÇA PÚBLICA' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DE ADMINISTRAÇÃO PENITENCIÁRIA E RESSOCIALIZAÇÃO – SEAP' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DE AGRICULTURA E MEIO AMBIENTE' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DE EDUCAÇÃO - SEC' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DE SAUDE DE SAO DOMINGOS' OR "source"."cliente__nome_razaosocial" IS NULL) AND ("source"."cliente__nome_razaosocial" <> 'SECRETARIA DO TRABALHO, EMPREGO, RENDA E ESPORTE' OR "source"."cliente__nome_razaosocial" IS NULL))
LIMIT 1048575 `
    await conectbd.bdhub(query_cliente_reincidente_ultimos_30d).then(data => {

        for (i = 0; i < data.length; i++) {
            var id_cliente_servico = data[i].id_cliente_servico
            select_id_servico(id_cliente_servico)
        }

    })
        .catch(err => {
            console.log(err)
        })
    setTimeout(() => {
        select_id_servico_pontuado()
    }, 700)
}

async function Tecnico_reincidente(id_servico) {

    // Função de consulta dos tecnicos que não resolveram problema e geraram reicidente, função depedende da query_cliente_reincidente_ultimos_30d e inseri o negativo no banco auxiliar
    for (i = 0; i < id_servico.length; i++) {
        await update_id_servico_pontuado(id_servico[i].idservico_cliente)
        //console.log(id_servico[i].idservico_cliente)
        const query_tecnico_reincidente = `SELECT "public"."ordem_servico"."data_termino_executado" AS "data_termino_executado", "public"."ordem_servico"."id_cliente_servico" AS "id_cliente_servico", "public"."ordem_servico"."numero_ordem_servico" AS "numero_ordem_servico", "ordem_servico_tecnico"."id_usuario" AS "ordem_servico_tecnico__id_usuario", "users"."name" AS "users__name", "cliente"."nome_razaosocial" AS "cliente__nome_razaosocial"
        FROM "public"."ordem_servico"
        LEFT JOIN "public"."ordem_servico_tecnico" "ordem_servico_tecnico" ON "public"."ordem_servico"."id_ordem_servico" = "ordem_servico_tecnico"."id_ordem_servico" LEFT JOIN "public"."users" "users" ON "ordem_servico_tecnico"."id_usuario" = "users"."id" LEFT JOIN "public"."cliente_servico" "cliente_servico" ON "public"."ordem_servico"."id_cliente_servico" = "cliente_servico"."id_cliente_servico" LEFT JOIN "public"."cliente" "cliente" ON "cliente_servico"."id_cliente" = "cliente"."id_cliente"
        WHERE ("public"."ordem_servico"."status" = 'finalizado'
           AND "public"."ordem_servico"."data_termino_executado" >= CAST((CAST(now() AS timestamp) + (INTERVAL '-30 day')) AS date) AND "public"."ordem_servico"."data_termino_executado" < CAST((CAST(now() AS timestamp) + (INTERVAL '1 day')) AS date) AND "cliente_servico"."id_cliente_servico" =`+ id_servico[i].idservico_cliente + `)
        ORDER BY "public"."ordem_servico"."data_termino_executado" ASC
        LIMIT 1048575`

        await conectbd.bdhub(query_tecnico_reincidente).then(async data => {
            var numero_os = data[0].numero_ordem_servico
            var id_servico = data[0].id_cliente_servico
            //console.log(numero_os)
            await Tecnico_reincidente_os(id_servico, numero_os)
        })
            .catch(err => {
                console.log(err)
            })
    }
}

async function Tecnico_reincidente_os(id_servico, numero_os) {
    // Função de consulta dos tecnicos que não resolveram problema e geraram reicidente, função depedende da query_cliente_reincidente_ultimos_30d e inseri o negativo no banco auxiliar
    const query_tecnico_reincidente = `SELECT "public"."ordem_servico"."id_cliente_servico" AS "id_cliente_servico", "public"."ordem_servico"."numero_ordem_servico" AS "numero_ordem_servico", "ordem_servico_tecnico"."id_usuario" AS "ordem_servico_tecnico__id_usuario", "users"."name" AS "users__name", "cliente"."nome_razaosocial" AS "cliente__nome_razaosocial"
        FROM "public"."ordem_servico"
        LEFT JOIN "public"."ordem_servico_tecnico" "ordem_servico_tecnico" ON "public"."ordem_servico"."id_ordem_servico" = "ordem_servico_tecnico"."id_ordem_servico" LEFT JOIN "public"."users" "users" ON "ordem_servico_tecnico"."id_usuario" = "users"."id" LEFT JOIN "public"."cliente_servico" "cliente_servico" ON "public"."ordem_servico"."id_cliente_servico" = "cliente_servico"."id_cliente_servico" LEFT JOIN "public"."cliente" "cliente" ON "cliente_servico"."id_cliente" = "cliente"."id_cliente"
        WHERE ("public"."ordem_servico"."status" = 'finalizado'
           AND "public"."ordem_servico"."data_termino_executado" >= CAST((CAST(now() AS timestamp) + (INTERVAL '-30 day')) AS date) AND "public"."ordem_servico"."data_termino_executado" < CAST((CAST(now() AS timestamp) + (INTERVAL '1 day')) AS date) AND "public"."ordem_servico"."numero_ordem_servico" = `+ numero_os + `)
        LIMIT 1048575`

    await conectbd.bdhub(query_tecnico_reincidente).then(data => {
        for (c = 0; c < data.length; c++) {
            Insert_pontos_negativos_reincidente(data[c].ordem_servico_tecnico__id_usuario)
            // console.log(data[c].ordem_servico_tecnico__id_usuario)
        }
        // console.log(data[0].id_cliente_servico)
    })
        .catch(err => {
            console.log(err)
        })

}


async function os_nivel_2_dupla() {
    // Consulta de quantidade de o.s de nivel 2
    // id_tipo_ordem_servico deve ser alterado pelos os id dos tipos de ordem serviço, aqui vai subtrair 2 pontos negativo caso a ordem de serviço foi feita em dupla
    const query_quantidade_os_nivel_1 = `select os.id_ordem_servico from atendimento a
    join ordem_servico os on os.id_atendimento = a.id_atendimento
    where os.data_termino_executado >= current_date and
    os.id_tipo_ordem_servico in ('52','9','62','13','59','61','8','30','16','6','15','11','32','31','63','4','15','53')
    and os.status = 'finalizado'`

    await conectbd.bdhub(query_quantidade_os_nivel_1).then(async data => {

        for (i = 0; i < data.length; i++) {
            await consulta_os(data[i].id_ordem_servico, 'n2')
        }
    })
        .catch(err => {
            console.log(err)
        })
}


async function consulta_os(id, tipo_os) {
    // Consulta de quantidade de o.s de nivel 1
    const query_quantidade_os_nivel_1 = ` select u.id from atendimento a
    join ordem_servico os on os.id_atendimento = a.id_atendimento
    join ordem_servico_tecnico ost on os.id_ordem_servico = ost.id_ordem_servico
    join users u on ost.id_usuario = u.id
    where os.id_ordem_servico = `+ id

    await conectbd.bdhub(query_quantidade_os_nivel_1).then(async data => {
        if (data.length >= 2) {
            for (b = 0; b < data.length; b++) {
                await Insert_pontos_negativos_os_dupla(data[b].id, tipo_os)
            }

        }

    })
        .catch(err => {
            console.log(err)
        })
}





//-----------------Sistema de Pontos--------------------------------------------------    

// Consulta de usuarios no sistema
function select_users_bd_apoio(id, name) {
    const query_consulta_usuario = `select * from users where id_users = ` + id + `;`
    conetbdmysql.bdauxilar(query_consulta_usuario).then(results => {
        if (results.length == 0) {
            Insert_User(id, name)
        } else {
            //console.log(results)
        }

    })
        .catch(err => {
            console.log(err)
        })
}

function Insert_User(id, name) {
    //console.log(id, name)
    //Insert usuario sistema auxiliar
    const insert_usuario_sistema_auxiliar = ` insert into users(id_users,name) values (` + id + `,'` + name + `'); `
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
        //console.log(data)
    })
        .catch(err => {
            console.log(err)
        })
}

function select_id_servico(id) {
    // console.log(id)
    const query_consulta_id_servico = `select idservico_cliente from servico_cliente where data_cadastro BETWEEN DATE_ADD(CURRENT_DATE(), INTERVAL -30 DAY) AND CURRENT_DATE() and idservico_cliente = ` + id + `;`
    conetbdmysql.bdauxilar(query_consulta_id_servico).then(results => {
        if (results.length == 0) {
            Insert_id_servico(id)
        } else {
            //console.log(results)
        }

    })
        .catch(err => {
            console.log(err)
        })
}

function Insert_pontos_positivos_nivel1(id_user, quantidade_os) {
    //Insert usuario sistema auxiliar
    var pontos = quantidade_os * 2
    const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (` + pontos + `,0,` + id_user + `,'` + data + `');`
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
    })
        .catch(err => {
            console.log(err)
        })

}

function Insert_pontos_positivos_nivel2(id_user, quantidade_os) {
    //Insert usuario sistema auxiliar
    var pontos = quantidade_os * 4
    const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (` + pontos + `,0,` + id_user + `,'` + data + `');`
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
    })
        .catch(err => {
            console.log(err)
        })

}

function Insert_pontos_positivos(id_user) {
    //Insert usuario sistema auxiliar
    var pontos = 4
    const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (` + pontos + `,0,` + id_user + `,'` + data + `');`
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
    })
        .catch(err => {
            console.log(err)
        })

}

function Insert_pontos_negativos(id_user) {
    console.log(id_user)
    //Insert usuario sistema auxiliar
    var pontos = 4
    const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (0,` + pontos + `,` + id_user + `,'` + data + `');`
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
    })
        .catch(err => {
            console.log(err)
        })

}

async function Insert_pontos_negativos_os_dupla(id_user, tipo_os) {
    //Insert usuario sistema auxiliar 
    if (tipo_os == 'n1') {
        var pontos = 1
        const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (0,` + pontos + `,` + id_user + `,'` + data + `');`
        await conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
        })
            .catch(err => {
                console.log(err)
            })
    } else {
        var pontos = 2
        const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (0,` + pontos + `,` + id_user + `,'` + data + `');`
        await conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
        })
            .catch(err => {
                console.log(err)
            })
    }


}


function Insert_pontos_negativos_reincidente(id_user) {
    console.log(id_user)
    //Insert usuario sistema auxiliar
    var pontos = 1
    const insert_usuario_sistema_auxiliar = `insert into pontos(pontos_positivos,pontos_negativos,users_id_users,data_cadastro) values (0,` + pontos + `,` + id_user + `,'` + data + `');`
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
    })
        .catch(err => {
            console.log(err)
        })

}

function Insert_id_servico(id) {
    //Insert usuario sistema auxiliar
    const insert_usuario_sistema_auxiliar = `insert into servico_cliente(idservico_cliente,data_cadastro,pontuado) values (` + id + `,'` + data + `', false); `
    conetbdmysql.bdauxilar(insert_usuario_sistema_auxiliar).then(data => {
        //console.log(data)
    })
        .catch(err => {
            console.log(err)
        })

}

async function select_id_servico_pontuado() {
    // console.log(id)
    const query_consulta_id_servico = `select idservico_cliente from servico_cliente where data_cadastro BETWEEN DATE_ADD(CURRENT_DATE(), INTERVAL -30 DAY) AND CURRENT_DATE() and pontuado = false;`
    await conetbdmysql.bdauxilar(query_consulta_id_servico).then(results => {
        //console.log(results)
        Tecnico_reincidente(results)
    })
        .catch(err => {
            console.log(err)
        })
    Quantidade_os_nivel_1()
}

async function update_id_servico_pontuado(id) {
    //console.log(id)
    const query_consulta_id_servico = `update servico_cliente set pontuado = 1 where idservico_cliente=` + id + `;`
    await conetbdmysql.bdauxilar(query_consulta_id_servico).then(results => {
    })
        .catch(err => {
            console.log(err)
        })
}

select_user_hubsoft()
