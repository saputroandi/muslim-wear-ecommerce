import AppDataSource from "../src/persistence/data-source";

async function run() {
  try {
    await AppDataSource.initialize();
    console.log("DataSource initialized");
    const migrations = await AppDataSource.showMigrations();
    console.log("pending migrations?", migrations);
    await AppDataSource.runMigrations();
    console.log("Migrations finished");
    await AppDataSource.destroy();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
