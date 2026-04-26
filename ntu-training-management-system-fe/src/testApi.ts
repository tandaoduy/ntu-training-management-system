import axios from "axios";

export const testApi = async () => {
  const res = await axios.get("http://localhost:8000/api/test");
  return res.data;
};