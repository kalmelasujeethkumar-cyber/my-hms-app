"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../controllers/patientController");
const router = (0, express_1.Router)();
router.get('/', patientController_1.getPatients);
router.post('/', patientController_1.addPatient);
router.patch('/:id/discharge', patientController_1.dischargePatient);
exports.default = router;
