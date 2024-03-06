const endpoint = "/messages";

const addMessage = async (newMessagePayload, token) => {
  try {
    const response = await fetch(`${endpoint}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newMessagePayload),
    });
    const newMessageData = await response.json();
    return newMessageData;
  } catch (error) {
    console.error("Messagesapi.addMessage:", error);
    throw error;
  }
};

const fetchMessages = async (gameID, token) => {
  try {
    const response = await fetch(`${endpoint}/${gameID}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const messagesData = await response.json();
    return messagesData;
  } catch (error) {
    console.error("Messagesapi.fetchMessages:", error);
    throw error;
  }
};

export { addMessage, fetchMessages };
