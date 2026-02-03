export const verifyAdminToken = async (token) => {
  const response = await fetch("/api/admin/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const loginAdmin = async (password) => {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  return response.json();
};

export const logoutAdmin = async (token) => {
  await fetch("/api/admin/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getSubmissions = async () => {
  const response = await fetch("/api/loi/submissions", {
    credentials: 'include',
  });
  return response.json();
};

export const getStats = async () => {
  const response = await fetch("/api/loi/stats", {
    credentials: 'include',
  });
  return response.json();
};
