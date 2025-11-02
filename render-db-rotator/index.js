/*
 This script replaces the free PostgreSQL database with another to avoid upgrading

 Steps
 1. list postgres instances - we will only have one instance
 2. retrieve connection info for the instance
 3: backup database
 4: delete db
 5: create a free db
 6: retrieve connection info for new db
 7: import the backed up data
 8: update the db credentials in app environment variable
*/

const { promisify } = require('util');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
require('dotenv').config();

const apiKey = process.env.API_KEY;
const serviceId = process.env.SERVICE_ID;

if(!apiKey || !serviceId) {
    console.error('Render API KEY or Api Service ID is not set in .env file.');
    process.exit(1);
}

const postgresBaseUrl = "https://api.render.com/v1/postgres";
const serviceBaseURL = "https://api.render.com/v1/services";

function getOptions(method, data) {
    return {
        method, 
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        ...(data ? {
            body: JSON.stringify(data)
        }: {})
    }
}

async function listDBInstances() {
    const url = `${postgresBaseUrl}?limit=1`;
    const options = getOptions('GET');

    const response = await fetch(url, options);

    const jsonResponse = await response.json();
    if(Array.isArray(jsonResponse)) {
        return jsonResponse[0];
    }

    return null;
}

async function exportDB(connectionString) {
    try {
        // pg_dump version 17+ is required
        const cmd = `pg_dump -F p --no-privileges --no-owner "${connectionString}" | grep -v -E "^\\(restrict|unrestrict)" > athena_db.sql`;

        await execAsync(cmd);
        console.log("✅ Export completed");

        // await execAsync('grep -v -E "^\\\\(restrict|unrestrict)" athena_db.sql > clean_dump.sql')

        return true;
    } catch (err) {
        console.error('❌ Export failed:', err.stderr || err.message);
    }

    return false;
}

async function deleteDB(dbId) {
    const url = `${postgresBaseUrl}/${dbId}`;
    const options = getOptions('DELETE');

    const response = await fetch(url, options);

    if(response.status === 204) {
        console.log("✅ DB Deleted");
    }

    return response.status === 204
}

async function createFreeDB(environmentId, ownerId) {
    const url = `${postgresBaseUrl}`;
    const options = getOptions('POST', {
        name: 'athena_db',
        ownerId,
        plan: 'free',
        version: '17',
        environmentId,
        ipAllowList: [
            {
                cidrBlock: '0.0.0.0/0',
                description: 'everywhere'
            }
        ]
    });

    const response = await fetch(url, options);

    if(response.status === 201) {
        console.log("✅ Create DB request sent");
        const jsonResponse = await response.json();
        return jsonResponse.id;
    }

    return null;
}

async function retrieveDBConnectionInfo(dbId) {
    const url = `${postgresBaseUrl}/${dbId}/connection-info`;
    const options = getOptions('GET');

    const response = await fetch(url, options);
    const jsonResponse = await response.json();

    return jsonResponse;
}

async function replaceDBUserInBackupQueryAndReturnQuery(search, replace) {
  try {
    const file = 'athena_db.sql';
    const content = await fs.readFile(file, 'utf8');

    const regex = new RegExp(search, 'g');
    const updatedContent = content.replace(regex, replace);
    await fs.writeFile(file, updatedContent, 'utf8');
    return updatedContent;
  } catch (err) {
    console.error('Error reading or writing file:', err);
  }
}

async function importDataIntoDB(connectionString, oldDBUser, newDBUser) {
    try {
        console.log(`Replacing all occurrences of ${oldDBUser} with ${newDBUser}`);
        await replaceDBUserInBackupQueryAndReturnQuery(oldDBUser, newDBUser);

        const sqlFilePath = path.resolve(__dirname, 'athena_db.sql');
        const args = [
            connectionString,
            '-f',
            sqlFilePath
        ];

        // psql version 17+ is required
        await execFileAsync('psql', args);
        console.log("✅ Import successful");

        return true;
    } catch (err) {
        console.error('❌ Import failed:', err.stderr, err.message);
        return false;
    }
}

async function getDBDetails(dbId) {
    const url = `${postgresBaseUrl}/${dbId}`;
    const options = getOptions('GET');

    const response = await fetch(url, options);

    if(response.status === 200) {
        const jsonResponse = await response.json();
        return jsonResponse;
    }

    return null;
}

async function getBDDetailsAndWaitForItToBeDoneCreating(dbId) {
    let dbStatus = "creating";
    let dbDetails = null;
    console.log("Waiting for db to be created");
    while (dbStatus?.toLocaleLowerCase() === "creating") {
        dbDetails = await getDBDetails(dbId);
        dbStatus = dbDetails?.status;

        // sleep for 3 secs and try again
        await sleep(3000);
    }

    return dbDetails;
}

async function updateDBCredentialsInAppEnvVariable(envKey, envValue) {
    const url = `${serviceBaseURL}/${serviceId}/env-vars/${envKey}`;
    const options = getOptions('PUT', {
        value: envValue,
    });

    const response = await fetch(url, options);

    return response.status === 200;
}

async function deployService() {
    const url = `${serviceBaseURL}/${serviceId}/deploys`;
    const options = getOptions('POST');

    const response = await fetch(url, options);

    return response.status === 201;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function begin() {
    const firstDB = await listDBInstances();
    if(firstDB) {
        const dbId = firstDB.postgres.id;
        const connectionInfo = await retrieveDBConnectionInfo(dbId);
        const connectionString = connectionInfo.externalConnectionString;
        const exportDBStatus = await exportDB(connectionString);
        if(exportDBStatus) {
            await deleteDB(dbId);
            const ownerId = firstDB.postgres.owner.id;
            const newDBId = await createFreeDB(firstDB.postgres.environmentId, ownerId);
            if(newDBId) {
                const dbDetail = await getBDDetailsAndWaitForItToBeDoneCreating(newDBId);

                if(dbDetail && dbDetail?.status === "available") {
                    const newDBConnectionInfo = await retrieveDBConnectionInfo(newDBId);
                    await sleep(10000); 
                    let importSuccessful = await importDataIntoDB(newDBConnectionInfo.externalConnectionString, firstDB.postgres.databaseUser, dbDetail.databaseUser);
                    if(!importSuccessful) {
                        console.log("Retrying import...");
                        await sleep(10000);
                        importSuccessful = await importDataIntoDB(newDBConnectionInfo.externalConnectionString, firstDB.postgres.databaseUser, dbDetail.databaseUser);
                    }

                    if(importSuccessful) {
                        const dbDashboardUrl = dbDetail.dashboardUrl?.split('/');
                        const dbServer = dbDashboardUrl[dbDashboardUrl.length - 1];
                        await updateDBCredentialsInAppEnvVariable("POSTGRES_PASSWORD", newDBConnectionInfo.password);
                        await updateDBCredentialsInAppEnvVariable("POSTGRES_DB", dbDetail.databaseName);
                        await updateDBCredentialsInAppEnvVariable("POSTGRES_USER", dbDetail.databaseUser);
                        await updateDBCredentialsInAppEnvVariable("POSTGRES_SERVER", dbServer);
                        await deployService(); // this is needed for updated environment to take effect
                        console.log("✅ Operation completed ✅")
                    }
                } else {
                    console.error("❌ DB failed to be available")
                }
            }
        }

    }
}

begin();
