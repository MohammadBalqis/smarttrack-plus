// client/src/pages/customer/CustomerCreateTrip.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getCustomerProductsApi } from "../../api/productApi";
import { getActiveCustomerCompanyApi } from "../../api/customerCompanyApi"; // ✅ FIX
import { createCustomerTripApi } from "../../api/customerTripsApi";

import MapPicker from "../../components/customer/MapPicker";
import styles from "../../styles/customer/createTrip.module.css";

const CustomerCreateTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);

  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState(null);
  const [dropoffLng, setDropoffLng] = useState(null);

  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerNotes, setCustomerNotes] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(3); // default, later from company settings

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================
     Derived totals
  ========================== */
  const productsTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalAmount = productsTotal + (Number(deliveryFee) || 0);

  /* ==========================
     Load active company + products
  ========================== */
  const loadInitial = async () => {
    try {
      setLoadingInitial(true);
      setError("");
      setSuccess("");

      // 1) Get active company
      const companyRes = await getActiveCustomerCompanyApi();
      if (!companyRes.data.ok || !companyRes.data.company) {
        setCompany(null);
        setError(
          "You haven’t selected a company yet. Please choose a company first."
        );
        return;
      }

      setCompany(companyRes.data.company);

      // 2) Load products for this company
      const productsRes = await getCustomerProductsApi();
      if (productsRes.data.ok) {
        setProducts(productsRes.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error loading create trip data:", err);
      setError("Failed to load data for creating an order.");
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================
     Cart helpers
  ========================== */
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  /* ==========================
     Geolocation (use my current location)
  ========================== */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPickupLat(latitude);
        setPickupLng(longitude);
        if (!pickupAddress) {
          setPickupAddress("My current location");
        }
        setError("");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Unable to detect your current location.");
      }
    );
  };

  /* ==========================
     Submit handler
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!company?._id) {
      setError("You must select a company before creating an order.");
      return;
    }

    if (!pickupAddress || !dropoffAddress) {
      setError("Pickup and dropoff addresses are required.");
      return;
    }

    if (!customerPhone) {
      setError("Please add a contact phone number.");
      return;
    }

    const fee = Number(deliveryFee) || 0;
    if (fee < 0) {
      setError("Delivery fee cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      // Build orderItems snapshot (ready for future backend usage)
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const payload = {
        companyId: company._id,
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        customerPhone,
        customerNotes,
        deliveryFee: fee,
        // Future ready fields (backend will ignore unknown props safely)
        orderItems,
        totalAmount,
      };

      const res = await createCustomerTripApi(payload);

      if (res.data?.ok) {
        setSuccess("Delivery request submitted successfully!");
        // After short success, redirect to trips list
        setTimeout(() => {
          navigate("/customer/trips");
        }, 800);
      } else {
        setError(
          res.data?.error || "Failed to create the delivery request."
        );
      }
    } catch (err) {
      console.error("Create trip error:", err);
      const msg =
        err.response?.data?.error ||
        "Server error while creating the delivery request.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoSelectCompany = () => {
    navigate("/customer/select-company");
  };

  const pickupLocation = {
    address: pickupAddress,
    lat: pickupLat,
    lng: pickupLng,
  };

  const dropoffLocation = {
    address: dropoffAddress,
    lat: dropoffLat,
    lng: dropoffLng,
  };

  /* ==========================
     RENDER
  ========================== */
  if (loadingInitial) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Loading order builder...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1>Create Delivery Order</h1>
          <p>Select a company first to start ordering.</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleGoSelectCompany}
        >
          Choose a company
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Create Delivery Order</h1>
          <p>
            Choose pickup & dropoff, review your items, and submit your
            SmartTrack+ delivery request.
          </p>
        </div>
        <div className={styles.companyChip}>
          <span className={styles.companyName}>{company.name}</span>
          {company.businessCategory && (
            <span className={styles.companyCategory}>
              {company.businessCategory.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.contentGrid}>
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            {/* Addresses */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Addresses</h3>
                  <p className={styles.sectionSub}>
                    Tell us where to pick up and where to deliver.
                  </p>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pickup address</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Company branch, Street name…"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </div>

              <div className={styles.coordsRow}>
                <div>
                  <label className={styles.smallLabel}>Pickup lat</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={pickupLat || ""}
                    onChange={(e) =>
                      setPickupLat(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className={styles.smallLabel}>Pickup lng</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={pickupLng || ""}
                    onChange={(e) =>
                      setPickupLng(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="optional"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Dropoff address</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Home, building name, full address…"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                />
              </div>

              <div className={styles.coordsRow}>
                <div>
                  <label className={styles.smallLabel}>Dropoff lat</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={dropoffLat || ""}
                    onChange={(e) =>
                      setDropoffLat(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className={styles.smallLabel}>Dropoff lng</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={dropoffLng || ""}
                    onChange={(e) =>
                      setDropoffLng(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="optional"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Notes */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Contact & Notes</h3>
                  <p className={styles.sectionSub}>
                    The driver will use this info to reach you.
                  </p>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone number</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 70 123 456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Notes to driver</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="e.g. Call me when you arrive, building has no elevator…"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Delivery fee</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={styles.input}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
                <p className={styles.fieldHelp}>
                  Later this can come automatically from company settings
                  (SmartTrack+ config).
                </p>
              </div>
            </div>

            {/* Summary & Submit */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3>Order Summary</h3>
              </div>

              <div className={styles.summaryRow}>
                <span>Products total</span>
                <span>${productsTotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery fee</span>
                <span>${(Number(deliveryFee) || 0).toFixed(2)}</span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryRowImportant}>
                <span>Total to pay</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit delivery request"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightColumn}>
            {/* Map */}
            <MapPicker
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
            />

            {/* Products & Cart */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Products & Cart</h3>
                  <p className={styles.sectionSub}>
                    Add items from this company to your order.
                  </p>
                </div>
              </div>

              {/* Product list */}
              {products.length === 0 ? (
                <p className={styles.mutedText}>
                  This company has no products configured yet.
                </p>
              ) : (
                <div className={styles.productGrid}>
                  {products.map((p) => (
                    <div key={p._id} className={styles.productCard}>
                      <div className={styles.productMain}>
                        <h4 className={styles.productName}>{p.name}</h4>
                        {p.description && (
                          <p className={styles.productDesc}>{p.description}</p>
                        )}
                        <p className={styles.productPrice}>
                          ${p.price?.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.chipButton}
                        onClick={() => addToCart(p)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart */}
              <div className={styles.cartSection}>
                <h4 className={styles.cartTitle}>Your cart</h4>
                {cart.length === 0 ? (
                  <p className={styles.mutedText}>
                    No items yet. Add some products above.
                  </p>
                ) : (
                  <ul className={styles.cartList}>
                    {cart.map((item) => (
                      <li key={item.productId} className={styles.cartItem}>
                        <div>
                          <p className={styles.cartItemName}>{item.name}</p>
                          <p className={styles.cartItemPrice}>
                            ${item.price.toFixed(2)} × {item.quantity} ={" "}
                            <strong>
                              {(item.price * item.quantity).toFixed(2)}
                            </strong>
                          </p>
                        </div>
                        <div className={styles.cartItemActions}>
                          <button
                            type="button"
                            className={styles.cartQtyBtn}
                            onClick={() =>
                              updateCartQuantity(item.productId, -1)
                            }
                          >
                            −
                          </button>
                          <span className={styles.cartQtyValue}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className={styles.cartQtyBtn}
                            onClick={() =>
                              updateCartQuantity(item.productId, 1)
                            }
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className={styles.cartRemoveBtn}
                            onClick={() => removeCartItem(item.productId)}
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomerCreateTrip;
