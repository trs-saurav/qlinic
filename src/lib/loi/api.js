export const submitLoi = async (formData) => {
  try {
    const response = await fetch("/api/loi/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to submit LOI");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting LOI:", error);
    throw error;
  }
};
