<h2>PASSO A PASSO DE INSTALAÇÃO</h2>
<br/>
<p>1- Instalar o mysql</p>
<p>2- Instalar nodejs no servidor</p>
<p>3- Instalar Grafana</p>
<p>4- Clonar repositorio</p>
<p>5- Editar os campos informado dentro do index.js</p>
<p>6- Adicionar o mysql no grafana</p>
<p>7- Incluir sql abaixo para fazer a consulta via grafana</p>
<p>
<code>select u.name, sum(pontos_positivos) as 'Pontos Positivos', sum(pontos_negativos) as 'Pontos Negativos', (sum(pontos_positivos) - sum(pontos_negativos)) as 'Total', case when (sum(pontos_positivos) - sum(pontos_negativos))<=299 then ((sum(pontos_positivos) - sum(pontos_negativos))*0.10) when (sum(pontos_positivos) - sum(pontos_negativos))>=300 and (sum(pontos_positivos) - sum(pontos_negativos))<=399  then ((sum(pontos_positivos) - sum(pontos_negativos))*0.30) when (sum(pontos_positivos) - sum(pontos_negativos))>=400 then ((sum(pontos_positivos) - sum(pontos_negativos))*0.50) end as "Valor R$"
from pontos p join users u on p.users_id_users = u.id_users where $__timeFilter(p.data_cadastro)
group by u.name order by "Total" desc;</code></p>
<p>8 - Criar um crontab para executar o index.js (recomendo executar todo noite ou de madrugada) e o crontab deve ser excutado sem sudo</p>
<p>
<code>crontab -e
10  23 *   *   *     node /home/gamificao/index.js 
</code>
</p>
<p>9 - Definir o ip do servidor, usuario e senha de acesso ao banco de dados do hubsoft</p>
<p>10 - Definir o ip do servidor, usuario e senha de acesso ao banco de dados do auxiliar</p>
