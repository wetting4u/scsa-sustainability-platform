"use client";

import { FormEvent, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  householdName: string;
  status: "active" | "disabled";
};

const initialUsers: AdminUser[] = [
  {
    id: "1",
    email: "user01@example.com",
    householdName: "Green Gum Household",
    status: "active",
  },
  {
    id: "2",
    email: "user02@example.com",
    householdName: "Riverbank Household",
    status: "disabled",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
  "all" | "active" | "disabled"
>("all");

  function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email")).trim().toLowerCase();
    const householdName = String(
      formData.get("householdName"),
    ).trim();

    setMessage("");
    setError("");

    if (users.some((user) => user.email === email)) {
      setError("A user with this email already exists.");
      return;
    }

    const newUser: AdminUser = {
      id: crypto.randomUUID(),
      email,
      householdName,
      status: "active",
    };

    setUsers((currentUsers) => [...currentUsers, newUser]);
    setMessage("Household user created in the frontend demo.");
    form.reset();
  }
  function toggleUserStatus(userId: string) {
  const selectedUser = users.find((user) => user.id === userId);

  if (!selectedUser) {
    return;
  }

  const nextStatus =
    selectedUser.status === "active" ? "disabled" : "active";

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === userId ? { ...user, status: nextStatus } : user,
    ),
  );

  setError("");
  setMessage(
    nextStatus === "disabled"
      ? `${selectedUser.email} has been disabled.`
      : `${selectedUser.email} has been restored.`,
  );
}

function deleteUser(userId: string) {
  const selectedUser = users.find((user) => user.id === userId);

  if (!selectedUser) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedUser.email}? This action cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.filter((user) => user.id !== userId),
  );

  setError("");
  setMessage(`${selectedUser.email} has been deleted.`);
}
function editHousehold(userId: string) {
  const currentUser = users.find((user) => user.id === userId);

  if (!currentUser) return;

  const newName = window.prompt(
    "Enter a new household name:",
    currentUser.householdName,
  );

  if (newName === null) return;

  const trimmedName = newName.trim();

  if (!trimmedName) {
    window.alert("Household name cannot be empty.");
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.id === userId
        ? { ...user, householdName: trimmedName }
        : user,
    ),
  );
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
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="eyebrow">ADMINISTRATION</div>

        <h1>Manage users</h1>

        <p>
          Create household accounts and review their current account status.
        </p>

        <section className="panel form-panel">
          <h2>Create household user</h2>

          <p>
            New accounts are created as ordinary household users. Administrator
            roles and passwords cannot be changed from this page.
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
                Household name
                <input
                  name="householdName"
                  type="text"
                  placeholder="Green Gum Household"
                  maxLength={60}
                  required
                />
              </label>
            </div>

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

            <div className="form-actions">
              <button className="button primary" type="submit">
                Create user
              </button>
            </div>
          </form>
        </section>

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
                style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
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
            <div style={{ marginTop: "14px", maxWidth: "220px" }}>
                <label
                    htmlFor="status-filter"
                    style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 && (
                <tr>
                    <td
                    colSpan={5}
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.householdName}</td>
                    <td>Household</td>
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
                        <div
                            style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            }}
                        >
                            <button
                            className="button secondary"
                            type="button"
                            onClick={() => toggleUserStatus(user.id)}
                            >
                            {user.status === "active" ? "Disable" : "Restore"}
                            </button>
                            <button
                            className="button secondary"
                            type="button"
                            onClick={() => editHousehold(user.id)}
                            >
                            Edit household
                            </button>
                            <button
                            className="button secondary"
                            type="button"
                            onClick={() => deleteUser(user.id)}
                            style={{
                                color: "#9d332c",
                                borderColor: "#d9aaa5",
                            }}
                            >
                            Delete
                            </button>
                        </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}