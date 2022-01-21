const { Pool } = require('pg')
const fs = require('fs')
const readline = require('readline')
const { EOL } = require('os')

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'safesupplier_local',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
})

async function getId(dbClient, crmAccountId, table = 'suppliers') {
    try {
        let result = await dbClient.query(`
            SELECT id, id_crm_account, name 
            FROM ${table} 
            WHERE id_crm_account = '${crmAccountId}';
        `)
        const id = result.rows[0].id
        return id
    } catch (err) {
        throw new Error(`${table[0].toUpperCase()}${table.slice(1,-1)} not found`)
    }
}

async function switchAnchoredSupplier (dbClient, {
    supplierToUnanchor, 
    supplierToAnchor, 
    clientAccountId, 
    unanchoredNewName
}) {   
    const getSupplierId = (account) => getId(dbClient, account, 'suppliers')
    const getClientId = (account) => getId(dbClient, account, 'clients')

    try {

        // Start transaction
        await dbClient.query('BEGIN')

        const [toUnanchorId, toAnchorId] = await Promise.all([
            getSupplierId(supplierToUnanchor),
            getSupplierId(supplierToAnchor)
        ]) 

        const clientId = await getClientId(clientAccountId)
        
        const updateAnchorResult = await dbClient.query(`
            UPDATE client_suppliers 
            SET id_supplier = '${toAnchorId}'
            WHERE id_supplier = '${toUnanchorId}'
            AND id_client = '${clientId}';
        `)
        
        // Give the newly unanchored supplier a name so we can identify
        // it easily. The jira ticket number is a sensible option.
        const updateSupplierNameResult = await dbClient.query(`
            UPDATE suppliers 
            SET name = '${unanchoredNewName}_' || name 
            WHERE id = '${toUnanchorId}';
        `)
        
        // commit the transaction
        await dbClient.query('COMMIT')
    } catch (err) {
        await dbClient.query('ROLLBACK')
        throw err
    } 
}

async function runQueries() {
    const filename = await askQuestion('What is the name of the file with the re-anchoring details?' + EOL)
    const file = fs.readFileSync(filename).toString()
    const listOfAnchorSwitchingDetails = JSON.parse(file) 
    const dbClient = await pool.connect()
    try {
        await Promise.all(listOfAnchorSwitchingDetails.map((details) => {
            return switchAnchoredSupplier(dbClient, details)
        }))
    } catch (err) {
        console.error(err.stack)
    } finally {
        dbClient.release()
        await pool.end()
    }
}

runQueries()


