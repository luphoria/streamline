import type { Handler } from "express";

export const get: Handler = (req, res) => {
	return res.send("1.0.0");
};
