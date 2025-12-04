// client/src/pages/company/CompanyShops.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyShopsApi,
  createCompanyShopApi,
  updateCompanyShopApi,
  deactivateCompanyShopApi,
} from "../../api/companyShopsApi";

import styles from "../../styles/company/shops.module.css";

const emptyForm = {
  name: "",
  city: "",
  address: "",
  phone: "",
  lat: "",
  lng: "",
  open: "08:00",
  close: "22:00",
  timezone: "Asia/Beirut",
  deliveryFeeOverride: "",
  maxDeliveryDistanceKm: "",
};

const CompanyShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadShops = async () => {
    try {
      setLoading(true);
      const res = await getCompanyShopsApi();
      if (res.data.ok) {
        setShops(res.data.shops || []);
      } else {
        setError("Failed to load shops.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading shops.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const openCreate = () => {
    setIsEdit(false);
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (shop) => {
    setIsEdit(true);
    setEditingId(shop._id);
    setForm({
      name: shop.name || "",
      city: shop.city || "",
      address: shop.address || "",
      phone: shop.phone || "",
      lat: shop.location?.lat ?? "",
      lng: shop.location?.lng ?? "",
      open: shop.workingHours?.open || "08:00",
      close: shop.workingHours?.close || "22:00",
      timezone: shop.workingHours?.timezone || "Asia/Beirut",
      deliveryFeeOverride:
        shop.deliveryFeeOverride === null ? "" : shop.deliveryFeeOverride,
      maxDeliveryDistanceKm:
        shop.maxDeliveryDistanceKm === null ? "" : shop.maxDeliveryDistanceKm,
    });
    setDrawerOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
        workingHours: {
          open: form.open || "08:00",
          close: form.close || "22:00",
          timezone: form.timezone || "Asia/Beirut",
        },
        deliveryFeeOverride:
          form.deliveryFeeOverride === ""
            ? null
            : Number(form.deliveryFeeOverride),
        maxDeliveryDistanceKm:
          form.maxDeliveryDistanceKm === ""
            ? null
            : Number(form.maxDeliveryDistanceKm),
      };

      if (!payload.name || !payload.city || !payload.address) {
        setError("Name, city and address are required.");
        setSaving(false);
        return;
      }

      if (isEdit && editingId) {
        await updateCompanyShopApi(editingId, payload);
      } else {
        await createCompanyShopApi(payload);
      }

      setDrawerOpen(false);
      setForm(emptyForm);
      await loadShops();
    } catch (err) {
      console.error(err);
      setError("Failed to save shop. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    const ok = window.confirm(
      "Deactivate this shop? It will no longer receive new orders."
    );
    if (!ok) return;

    try {
      await deactivateCompanyShopApi(id);
      await loadShops();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate shop.");
    }
  };

  if (loading) return <p className={styles.info}>Loading shops…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Shops & Branches</h1>
          <p className={styles.sub}>
            Manage all your branches in different cities. Each shop can have its
            own address and delivery settings.
          </p>
        </div>

        <button className={styles.newBtn} onClick={openCreate}>
          + New Shop
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {shops.length === 0 && (
        <p className={styles.info}>
          No shops yet. Create your first shop to start organizing branches.
        </p>
      )}

      <div className={styles.grid}>
        {shops.map((shop) => (
          <div
            key={shop._id}
            className={`${styles.card} ${
              !shop.isActive ? styles.cardInactive : ""
            }`}
          >
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.shopName}>{shop.name}</h3>
                <p className={styles.shopCity}>
                  {shop.city} • {shop.address}
                </p>
              </div>

              <span
                className={
                  shop.isActive ? styles.badgeActive : styles.badgeInactive
                }
              >
                {shop.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.label}>Phone</span>
              <span>{shop.phone || "Not set"}</span>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.label}>Working Hours</span>
              <span>
                {shop.workingHours?.open || "08:00"} –{" "}
                {shop.workingHours?.close || "22:00"} (
                {shop.workingHours?.timezone || "Asia/Beirut"})
              </span>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.label}>Delivery Fee</span>
              <span>
                {shop.deliveryFeeOverride != null
                  ? `$${shop.deliveryFeeOverride}`
                  : "Use company default"}
              </span>
            </div>

            <div className={styles.cardRow}>
              <span className={styles.label}>Max Distance</span>
              <span>
                {shop.maxDeliveryDistanceKm != null
                  ? `${shop.maxDeliveryDistanceKm} km`
                  : "Use company default"}
              </span>
            </div>

            <div className={styles.cardFooter}>
              <button
                className={styles.editBtn}
                onClick={() => openEdit(shop)}
              >
                Edit
              </button>

              {shop.isActive && (
                <button
                  className={styles.deactivateBtn}
                  onClick={() => handleDeactivate(shop._id)}
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => !saving && setDrawerOpen(false)}
          />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2>{isEdit ? "Edit Shop" : "Create Shop"}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => !saving && setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="lat"
                    value={form.lat}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="lng"
                    value={form.lng}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.sectionTitle}>Working Hours</div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Open</label>
                  <input
                    type="time"
                    name="open"
                    value={form.open}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label>Close</label>
                  <input
                    type="time"
                    name="close"
                    value={form.close}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Timezone</label>
                <input
                  type="text"
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.sectionTitle}>Delivery Settings</div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Delivery Fee Override ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    name="deliveryFeeOverride"
                    value={form.deliveryFeeOverride}
                    onChange={handleChange}
                    placeholder="Leave empty to use company default"
                  />
                </div>

                <div className={styles.field}>
                  <label>Max Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="maxDeliveryDistanceKm"
                    value={form.maxDeliveryDistanceKm}
                    onChange={handleChange}
                    placeholder="Leave empty to use company default"
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => !saving && setDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyShops;
