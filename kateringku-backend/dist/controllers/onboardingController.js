"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const onboardingService_js_1 = require("../services/onboardingService.js");
const response_js_1 = require("../utils/response.js");
const onboardingService = new onboardingService_js_1.OnboardingService();
class OnboardingController {
    static async seedContohData(req, res, next) {
        try {
            await onboardingService.seedContohData(req.usahaId);
            (0, response_js_1.apiSuccess)(res, null, 'Data contoh bahan, menu, dan resep berhasil ditambahkan', 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OnboardingController = OnboardingController;
//# sourceMappingURL=onboardingController.js.map