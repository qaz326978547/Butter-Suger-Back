const express = require("express");

const router = express.Router();
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");

router.get("/", async (req, res, next) => {
  res.status(200);
  res.json({
    status: "success",
    data: {
      creditPackages: [
        {
          id: 1,
          name: "Basic Package",
          price: 100,
          credits: 10,
        },
        {
          id: 2,
          name: "Premium Package",
          price: 200,
          credits: 25,
        },
      ],
    },
  });
});

router.post("/", async (req, res, next) => {});

router.delete("/:creditPackageId", async (req, res, next) => {});

module.exports = router;
