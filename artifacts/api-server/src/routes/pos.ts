import { Router } from "express";
import { db, branchesTable, productsTable, transactionsTable, customersTable, cashflowTransactionsTable, shopeeOrdersTable, shiftsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/utils";

const router = Router();

// Helper function to emit socket events
const emitUpdate = (req: any, entity: string) => {
  if (req.app.get('io')) {
    req.app.get('io').emit("data-updated", { entity });
  }
};

// --- Branches ---
router.get("/branches", async (req, res) => {
  const data = await db.select().from(branchesTable);
  res.json(data);
});

router.post("/branches", async (req, res) => {
  const { name, address, phone } = req.body;
  const newBranch = {
    id: generateId("br"),
    name,
    address,
    phone,
  };
  await db.insert(branchesTable).values(newBranch);
  
  // Also need to initialize product stock for this branch
  const products = await db.select().from(productsTable);
  for (const product of products) {
    const newStock = { ...product.stock, [newBranch.id]: 0 };
    await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, product.id));
  }
  
  emitUpdate(req, "branches");
  emitUpdate(req, "products");
  res.json(newBranch);
});

// --- Products ---
router.get("/products", async (req, res) => {
  const data = await db.select().from(productsTable);
  res.json(data);
});

router.post("/products", async (req, res) => {
  const body = req.body;
  let result;
  
  if (body.id) {
    // Update
    await db.update(productsTable).set({ ...body, updatedAt: new Date() }).where(eq(productsTable.id, body.id));
    result = body;
  } else {
    // Create
    const newProduct = {
      ...body,
      id: generateId("p"),
      sku: body.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
      category: body.category || "Lainnya",
      stock: body.stock || {},
    };
    await db.insert(productsTable).values(newProduct);
    result = newProduct;
  }
  
  emitUpdate(req, "products");
  res.json(result);
});

router.delete("/products/:id", async (req, res) => {
  await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
  emitUpdate(req, "products");
  res.json({ success: true });
});

router.put("/products/stock", async (req, res) => {
  const { productId, branchId, newStock } = req.body;
  const product = (await db.select().from(productsTable).where(eq(productsTable.id, productId)))[0];
  if (product) {
    const updatedStock = { ...product.stock, [branchId]: Math.max(0, newStock) };
    await db.update(productsTable).set({ stock: updatedStock }).where(eq(productsTable.id, productId));
    emitUpdate(req, "products");
  }
  res.json({ success: true });
});

// --- Transactions ---
router.get("/transactions", async (req, res) => {
  const branchId = req.query.branchId as string;
  let data;
  if (branchId) {
    data = await db.select().from(transactionsTable).where(eq(transactionsTable.branchId, branchId));
  } else {
    data = await db.select().from(transactionsTable);
  }
  data.sort((a, b) => b.date.getTime() - a.date.getTime());
  res.json(data);
});

router.post("/transactions", async (req, res) => {
  const data = req.body;
  const newTx = {
    ...data,
    id: generateId("tx"),
    receiptNo: `TRX-${Math.floor(Math.random() * 1000000)}`,
    date: new Date(),
  };

  // Reduce stock
  for (const item of data.items) {
    const product = (await db.select().from(productsTable).where(eq(productsTable.id, item.productId)))[0];
    if (product) {
      const currentStock = product.stock[data.branchId] || 0;
      const newStock = { ...product.stock, [data.branchId]: Math.max(0, currentStock - item.qty) };
      await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, product.id));
    }
  }

  // Handle Customer points
  if (data.customerPhone) {
    const existing = (await db.select().from(customersTable).where(eq(customersTable.phone, data.customerPhone)))[0];
    const pointsToAdd = Math.floor(data.total / 10000);
    if (!existing) {
      await db.insert(customersTable).values({
        id: generateId("cus"),
        name: data.customerName || "Pelanggan",
        phone: data.customerPhone,
        points: pointsToAdd
      });
    } else {
      await db.update(customersTable)
        .set({ name: data.customerName || existing.name, points: existing.points + pointsToAdd })
        .where(eq(customersTable.id, existing.id));
    }
    emitUpdate(req, "customers");
  }

  await db.insert(transactionsTable).values(newTx);
  emitUpdate(req, "transactions");
  emitUpdate(req, "products");
  res.json(newTx);
});

router.put("/transactions/:id/void", async (req, res) => {
  const txId = req.params.id;
  const tx = (await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId)))[0];
  if (!tx || tx.status === "void") {
    res.json({ success: false });
    return;
  }

  await db.update(transactionsTable).set({ status: "void" }).where(eq(transactionsTable.id, txId));

  // Return stock
  for (const item of tx.items) {
    const product = (await db.select().from(productsTable).where(eq(productsTable.id, item.productId)))[0];
    if (product) {
      const currentStock = product.stock[tx.branchId] || 0;
      const newStock = { ...product.stock, [tx.branchId]: currentStock + item.qty };
      await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, product.id));
    }
  }

  emitUpdate(req, "transactions");
  emitUpdate(req, "products");
  res.json({ success: true });
});

// --- Customers ---
router.get("/customers", async (req, res) => {
  const data = await db.select().from(customersTable);
  res.json(data);
});

// --- Cashflow ---
router.get("/cashflow", async (req, res) => {
  const branchId = req.query.branchId as string;
  let data;
  if (branchId) {
    data = await db.select().from(cashflowTransactionsTable).where(eq(cashflowTransactionsTable.branchId, branchId));
  } else {
    data = await db.select().from(cashflowTransactionsTable);
  }
  data.sort((a, b) => b.date.getTime() - a.date.getTime());
  res.json(data);
});

router.post("/cashflow", async (req, res) => {
  const newEntry = {
    ...req.body,
    id: generateId("cf"),
    date: new Date(req.body.date),
  };
  await db.insert(cashflowTransactionsTable).values(newEntry);
  emitUpdate(req, "cashflow");
  res.json(newEntry);
});

// --- Shopee Orders ---
router.get("/shopee", async (req, res) => {
  const data = await db.select().from(shopeeOrdersTable);
  res.json(data);
});

router.put("/shopee/:id/status", async (req, res) => {
  await db.update(shopeeOrdersTable).set({ status: req.body.status }).where(eq(shopeeOrdersTable.id, req.params.id));
  emitUpdate(req, "shopee");
  res.json({ success: true });
});

// --- Shifts ---
router.get("/shifts", async (req, res) => {
  const branchId = req.query.branchId as string;
  let data;
  if (branchId) {
    data = await db.select().from(shiftsTable).where(eq(shiftsTable.branchId, branchId));
  } else {
    data = await db.select().from(shiftsTable);
  }
  res.json(data);
});

router.post("/shifts/open", async (req, res) => {
  const { branchId, initialCash } = req.body;
  const newShift = {
    id: generateId("shf"),
    branchId,
    initialCash,
    startTime: new Date(),
    status: "active",
  };
  await db.insert(shiftsTable).values(newShift);
  emitUpdate(req, "shifts");
  res.json(newShift);
});

router.post("/shifts/close", async (req, res) => {
  const { shiftId, finalCash } = req.body;
  await db.update(shiftsTable).set({ 
    status: "closed", 
    endTime: new Date(),
    finalCash 
  }).where(eq(shiftsTable.id, shiftId));
  
  const shift = (await db.select().from(shiftsTable).where(eq(shiftsTable.id, shiftId)))[0];
  emitUpdate(req, "shifts");
  res.json(shift);
});

// --- Settings ---
router.get("/settings", async (req, res) => {
  let settings = (await db.select().from(settingsTable).where(eq(settingsTable.id, "default")))[0];
  if (!settings) {
    settings = {
      id: "default",
      storeName: "Toko Mega Mandiri",
      receiptFooter: "Terima kasih atas kunjungan Anda!",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(settingsTable).values(settings);
  }
  res.json(settings);
});

export default router;
