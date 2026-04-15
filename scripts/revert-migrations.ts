import AppDataSource from "../src/persistence/data-source";

async function run() {
  try {
    await AppDataSource.initialize();
    console.log("DataSource initialized");
    await AppDataSource.undoLastMigration();
    console.log("Reverted last migration");
    await AppDataSource.destroy();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
