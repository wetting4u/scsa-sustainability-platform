"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui";

import { adminUsersApi } from "@/features/admin-users/client";
import type { AdminManagedUser } from "@/features/admin-users/domain";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const result = await adminUsersApi.list();
      setUsers(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const password = String(formData.get("password") ?? "");

    const householdName = String(formData.get("householdName") ?? "").trim();

    const householdSize = Number(formData.get("householdSize"));

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const result = await adminUsersApi.create({
        email,
        password,
        householdName,
        householdSize,
      });

      setUsers((currentUsers) => [result.data, ...currentUsers]);

      setMessage(`${result.data.email} has been created.`);
      form.reset();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the user.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleUserStatus(userId: string) {
    const selectedUser = users.find((user) => user.id === userId);

    if (!selectedUser || selectedUser.role === "admin") {
      return;
    }

    const disabled = selectedUser.status === "active";

    setWorkingId(userId);
    setMessage("");
    setError("");

    try {
      await adminUsersApi.update(userId, {
        disabled,
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                status: disabled ? "disabled" : "active",
              }
            : user,
        ),
      );

      setMessage(
        disabled
          ? `${selectedUser.email} has been disabled.`
          : `${selectedUser.email} has been restored.`,
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update the user status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function editUser(userId: string) {
    const currentUser = users.find((user) => user.id === userId);

    if (!currentUser || currentUser.role === "admin") {
      return;
    }

    const newEmail = window.prompt(
      "Enter the user's email address:",
      currentUser.email,
    );

    if (newEmail === null) {
      return;
    }

    const newHouseholdName = window.prompt(
      "Enter a new household name:",
      currentUser.householdName,
    );

    if (newHouseholdName === null) {
      return;
    }

    const newHouseholdSize = window.prompt(
      "Enter the household size:",
      String(currentUser.householdSize),
    );

    if (newHouseholdSize === null) {
      return;
    }

    const email = newEmail.trim().toLowerCase();
    const householdName = newHouseholdName.trim();
    const householdSize = Number(newHouseholdSize);

    if (!email || !householdName) {
      window.alert("Email and household name cannot be empty.");
      return;
    }

    if (
      !Number.isInteger(householdSize) ||
      householdSize < 1 ||
      householdSize > 20
    ) {
      window.alert("Household size must be a whole number between 1 and 20.");
      return;
    }

    setWorkingId(userId);
    setMessage("");
    setError("");

    try {
      await adminUsersApi.update(userId, {
        email,
        householdName,
        householdSize,
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                email,
                householdName,
                householdSize,
              }
            : user,
        ),
      );

      setMessage(`${email} has been updated.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the user.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteUser(userId: string) {
    const selectedUser = users.find((user) => user.id === userId);

    if (!selectedUser || selectedUser.role === "admin") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.email}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setWorkingId(userId);
    setMessage("");
    setError("");

    try {
      await adminUsersApi.remove(userId);

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId),
      );

      setMessage(`${selectedUser.email} has been deleted.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the user.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.trim().toLowerCase();

    const matchesSearch =
      user.email.toLowerCase().includes(keyword) ||
      user.householdName.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Manage users."
        description="Create household accounts and review their current account status."
      />

      <section className="panel form-panel">
        <h2>Create household user</h2>

        <p>
          New accounts are created as confirmed ordinary household users and can
          sign in immediately. The administrator account remains protected.
        </p>

        <form onSubmit={handleCreateUser}>
          <div className="form-grid">
            <label>
              Email address
              <input
                name="email"
                type="email"
                placeholder="household@example.com"
                required
              />
            </label>

            <label>
              Temporary password
              <input
                name="password"
                type="password"
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}"
                title="Use at least 8 characters with uppercase, lowercase, a number and a special character."
                required
              />
            </label>

            <label>
              Household name
              <input
                name="householdName"
                type="text"
                placeholder="Green Gum Household"
                maxLength={60}
                required
              />
            </label>

            <label>
              Household size
              <input
                name="householdSize"
                type="number"
                min={1}
                max={20}
                step={1}
                defaultValue={1}
                required
              />
            </label>
          </div>

          <p className="caption">
            Passwords require at least 8 characters, uppercase and lowercase
            letters, a number, and a special character. No verification email is
            required for administrator-created accounts.
          </p>

          <div className="form-actions">
            <button
              className="button primary"
              type="submit"
              disabled={creating || workingId !== null}
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}

      <section className="panel">
        <div className="section-title">
          <h2>Household users</h2>
          <span>
            {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        <div className="table-scroll">
          <div style={{ marginBottom: "28px" }}>
            <label
              htmlFor="user-search"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Search users
            </label>

            <input
              id="user-search"
              type="search"
              placeholder="Search by email or household..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #cfd8cf",
                borderRadius: "6px",
              }}
            />

            <div
              style={{
                marginTop: "14px",
                maxWidth: "220px",
              }}
            >
              <label
                htmlFor="status-filter"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Filter by status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "active" | "disabled",
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cfd8cf",
                  borderRadius: "6px",
                  backgroundColor: "white",
                }}
              >
                <option value="all">All users</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Household name</th>
                <th>Size</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                    }}
                  >
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && !error && filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#6b746b",
                    }}
                  >
                    No users found. Try a different email or household name.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredUsers.map((user) => {
                  const protectedAdmin = user.role === "admin";
                  const working = workingId === user.id;

                  return (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.householdName || "Unnamed household"}</td>
                      <td>{user.householdSize}</td>
                      <td>{protectedAdmin ? "Administrator" : "Household"}</td>
                      <td>
                        <span
                          style={{
                            color:
                              user.status === "active" ? "#2e603d" : "#9d332c",
                            fontWeight: 600,
                          }}
                        >
                          {user.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td>
                        {protectedAdmin ? (
                          <span className="caption">
                            Protected administrator
                          </span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              className="button secondary"
                              type="button"
                              disabled={creating || workingId !== null}
                              onClick={() => void toggleUserStatus(user.id)}
                            >
                              {working
                                ? "Updating..."
                                : user.status === "active"
                                  ? "Disable"
                                  : "Restore"}
                            </button>

                            <button
                              className="button secondary"
                              type="button"
                              disabled={creating || workingId !== null}
                              onClick={() => void editUser(user.id)}
                            >
                              Edit user
                            </button>

                            <button
                              className="button secondary"
                              type="button"
                              disabled={creating || workingId !== null}
                              onClick={() => void deleteUser(user.id)}
                              style={{
                                color: "#9d332c",
                                borderColor: "#d9aaa5",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
