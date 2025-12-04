import React, { useState } from "react";
import { changeCustomerPasswordApi } from "../../../api/customerSettingsApi";
import styles from "../../../styles/customer/settingsForm.module.css";

const ChangePassword = () => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    try {
      const res = await changeCustomerPasswordApi({
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Error changing password");
    }
  };

  return (
    <div className={styles.box}>
      <h3>Change Password</h3>

      <label>Current Password</label>
      <input
        type="password"
        value={oldPass}
        onChange={(e) => setOldPass(e.target.value)}
      />

      <label>New Password</label>
      <input
        type="password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
      />

      <button onClick={submit}>Update</button>
      {message && <p className={styles.msg}>{message}</p>}
    </div>
  );
};

export default ChangePassword;
