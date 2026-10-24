"use client";

import { useActionState, useEffect, useOptimistic, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  formatRupiah,
  getProducts,
  isAdmin,
  requireLogin,
  type Product,
  type User,
} from "../lib/api";
import { createProductAction, deleteProductAction } from "./actions";
import {
  emptyFormState,
  formValues,
  ProductFields,
  resultToState,
  validateOnClient,
  asActionInput,
  type ProductFormState,
} from "./product-form";

// Produk yang tampil di tabel; pending = belum dikonfirmasi server.
type ListedProduct = Product & { pending?: boolean };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // ==============================
  // TAMBAH CEPAT + UPDATE OPTIMISTIK
  // ==============================
  // Produk baru langsung muncul di tabel (useOptimistic) sebelum server menjawab.
  // Setelah Server Action selesai, baris sementara diganti data asli dari server;
  // kalau gagal, baris sementara otomatis hilang.
  const [optimisticProducts, addOptimisticProduct] = useOptimistic(
    products as ListedProduct[],
    (current, newProduct: ListedProduct) => [newProduct, ...current]
  );


  const [quickAddState, quickAddAction, quickAdding] = useActionState(
    async (_prev: ProductFormState, formData: FormData): Promise<ProductFormState> => {
      const values = formValues(formData);

      const clientErrors = validateOnClient(values);
      if (clientErrors) return { values, fieldErrors: clientErrors };

      addOptimisticProduct({
        id: -Date.now(),
        sku: "…",
        name: values.name,
        category: values.category as Product["category"],
        priceRetail: Number(values.priceRetail),
        priceModal: Number(values.priceModal),
        stock: Number(values.stock),
        minimumStock: 5,
        isActive: true,
        isLowStock: false,
        createdAt: new Date().toISOString(),
        pending: true,
      });

      const result = await createProductAction(asActionInput(values));
      if (result.data) {
        const saved = result.data;
        setProducts((current) => [saved, ...current]);
        return { values: {}, fieldErrors: {}, success: true };
      }
      return resultToState(values, result);
    },
    emptyFormState
  );

  // FILTER
  const [categoryFilter, setCategoryFilter] =
    useState("Semua Kategori");

  const [statusFilter, setStatusFilter] =
    useState("Semua Status");


  // ==============================
  // LOAD PRODUCTS (dari backend)
  // ==============================
  useEffect(() => {
    const currentUser = requireLogin();
    if (!currentUser) return;

    getProducts()
      .then((data) => {
        setUser(currentUser);
        setProducts(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);


  // ==============================
  // SEARCH + FILTER
  // ==============================
  const filteredProducts =
    optimisticProducts.filter((product) => {

      // Filter berdasarkan nama
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase());


      // Filter berdasarkan kategori
      const matchesCategory =
        categoryFilter === "Semua Kategori" ||
        CATEGORY_LABELS[product.category] === categoryFilter;


      // Tentukan status produk
      let productStatus = "Tersedia";

      if (product.stock === 0) {
        productStatus = "Habis";
      } else if (product.stock <= 5) {
        productStatus = "Stok Menipis";
      }


      // Filter berdasarkan status
      const matchesStatus =
        statusFilter === "Semua Status" ||
        productStatus === statusFilter;


      // Produk harus memenuhi semua filter
      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });


  // ==============================
  // HAPUS PRODUK
  // ==============================
  const handleDelete = async (
    id: number,
    name: string
  ) => {

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus produk "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    const result = await deleteProductAction({ id });

    if (result.data) {
      setProducts(
        products.filter(
          (product) =>
            product.id !== id
        )
      );

      alert("Produk berhasil dihapus!");
    } else {
      alert(`Gagal menghapus produk: ${result.serverError || "data tidak valid"}`);
    }
  };


  return (
    <div className="dashboard">

      {/* ==============================
          SIDEBAR
      ============================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            ❄
          </div>

          <div>
            <h2>Ikobana</h2>
            <span>Frozenfood</span>
          </div>

        </div>


        <nav className="menu">

          <a
            className="menu-item"
            href="/dashboard"
          >
            <span>▣</span>
            Dashboard
          </a>


          <a
            className="menu-item active"
            href="/products"
          >
            <span>▤</span>
            Produk & Stok
          </a>


          <a
            className="menu-item"
            href="/transactions"
          >
            <span>▥</span>
            Transaksi
          </a>


          <a
            className="menu-item"
            href="/settings"
          >
            <span>⚙</span>
            Pengaturan
          </a>

        </nav>


        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="avatar">
              A
            </div>

            <div>
              <strong>{user?.fullName || "Admin"}</strong>
              <small>{user?.role === "ADMIN" ? "Administrator" : "Pengguna"}</small>
            </div>

          </div>


          <a
            href="/"
            className="logout"
          >
            ↪ Keluar
          </a>

        </div>

      </aside>


      {/* ==============================
          MAIN
      ============================== */}

      <main className="dashboard-content">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>
              Produk & Stok
            </h1>

            <p>
              Kelola produk dan stok barang Anda
            </p>

          </div>


          <div className="header-right">

            <button className="notification">
              🔔
            </button>


            <div className="header-user">

              <div className="avatar">
                A
              </div>

              <div>
                <strong>{user?.fullName || "Admin"}</strong>
                <small>{user?.role === "ADMIN" ? "Administrator" : "Pengguna"}</small>
              </div>

            </div>

          </div>

        </header>


        {/* ==============================
            TOP ACTION
        ============================== */}

        <div className="product-actions">

          <div>

            <h2>
              Daftar Produk
            </h2>

            <p>
              Kelola semua produk frozen food
            </p>

          </div>


          {/* Tombol kelola produk hanya untuk Admin */}
          {isAdmin(user) && (
            <Link
              href="/products/add"
              className="add-product"
            >
              + Tambah Produk
            </Link>
          )}

        </div>


        {/* ==============================
            TAMBAH CEPAT (Admin)
        ============================== */}

        {isAdmin(user) && (
          <section className="quick-add-card">

            <h3>Tambah Cepat</h3>
            <p>Produk baru langsung muncul di tabel, lalu diganti data dari server.</p>

            {quickAddState.success && (
              <div className="form-success">Produk berhasil ditambahkan.</div>
            )}

            <form
              action={quickAddAction}
              noValidate
              className="quick-add-form"
            >
              <ProductFields state={quickAddState} showDescription={false} />

              <button type="submit" disabled={quickAdding}>
                {quickAdding ? "Menyimpan..." : "+ Tambah"}
              </button>
            </form>

          </section>
        )}


        {/* ==============================
            STATISTICS
        ============================== */}

        <section className="statistics">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-icon blue">
              📦
            </div>

            <div>

              <p>
                Total Produk
              </p>

              <h2>
                {products.length}
              </h2>

            </div>

          </div>


          {/* STOK TERSEDIA */}

          <div className="stat-card">

            <div className="stat-icon green">
              ✓
            </div>

            <div>

              <p>
                Stok Tersedia
              </p>

              <h2>
                {products.reduce(
                  (total, product) =>
                    total + product.stock,
                  0
                )}
              </h2>

            </div>

          </div>


          {/* STOK MENIPIS */}

          <div className="stat-card">

            <div className="stat-icon orange">
              ⚠
            </div>

            <div>

              <p>
                Stok Menipis
              </p>

              <h2>
                {
                  products.filter(
                    (product) =>
                      product.stock > 0 &&
                      product.stock <= 5
                  ).length
                }
              </h2>

            </div>

          </div>


          {/* STOK HABIS */}

          <div className="stat-card">

            <div className="stat-icon purple">
              ⛔
            </div>

            <div>

              <p>
                Stok Habis
              </p>

              <h2>
                {
                  products.filter(
                    (product) =>
                      product.stock === 0
                  ).length
                }
              </h2>

            </div>

          </div>

        </section>


        {/* ==============================
            PRODUCT TABLE
        ============================== */}

        <section className="dashboard-card product-table-card">


          {/* TOOLBAR */}

          <div className="product-toolbar">


            {/* SEARCH */}

            <div className="search-box">

              <span>
                🔍
              </span>


              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>


            {/* FILTER KATEGORI */}

            <select
              className="product-filter"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value
                )
              }
            >

              <option>
                Semua Kategori
              </option>

              {Object.values(CATEGORY_LABELS).map((label) => (
                <option key={label}>
                  {label}
                </option>
              ))}

            </select>


            {/* FILTER STATUS */}

            <select
              className="product-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >

              <option>
                Semua Status
              </option>

              <option>
                Tersedia
              </option>

              <option>
                Stok Menipis
              </option>

              <option>
                Habis
              </option>

            </select>

          </div>


          {/* ==============================
              TABLE
          ============================== */}

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Produk
                  </th>

                  <th>
                    SKU
                  </th>

                  <th>
                    Kategori
                  </th>

                  <th>
                    Harga
                  </th>

                  <th>
                    Stok
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Aksi
                  </th>

                </tr>

              </thead>


              <tbody>

                {loading || error ? (

                  <tr>

                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: error ? "#dc2626" : undefined,
                      }}
                    >
                      {error || "Memuat produk..."}
                    </td>

                  </tr>

                ) : filteredProducts.length > 0 ? (

                  filteredProducts.map(
                    (product) => (

                      <tr
                        key={product.id}
                        className={product.pending ? "optimistic-row" : undefined}
                      >

                        {/* PRODUK */}

                        <td>

                          <strong>
                            {product.name}
                          </strong>

                          {product.pending && (
                            <div className="saving-badge">Menyimpan…</div>
                          )}

                        </td>


                        {/* SKU */}

                        <td>
                          {product.sku}
                        </td>


                        {/* KATEGORI */}

                        <td>
                          {CATEGORY_LABELS[product.category]}
                        </td>


                        {/* HARGA */}

                        <td>
                          {formatRupiah(product.priceRetail)}
                        </td>


                        {/* STOK */}

                        <td>
                          {product.stock}
                        </td>


                        {/* STATUS */}

                        <td>

                          {product.stock === 0 ? (

                            <span className="status danger">
                              Habis
                            </span>

                          ) : product.stock <= 5 ? (

                            <span className="status pending">
                              Stok Menipis
                            </span>

                          ) : (

                            <span className="status success">
                              Tersedia
                            </span>

                          )}

                        </td>


                        {/* AKSI */}

                        <td>

                          {isAdmin(user) && !product.pending ? (

                            <div className="product-actions-buttons">

                              <Link
                                href={`/products/edit/${product.id}`}
                                className="edit-button"
                              >
                                Edit
                              </Link>


                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDelete(
                                    product.id,
                                    product.name
                                  )
                                }
                              >
                                Hapus
                              </button>

                            </div>

                          ) : (

                            <span style={{ color: "#999" }}>
                              -
                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      Tidak ada produk yang sesuai
                      dengan filter.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}