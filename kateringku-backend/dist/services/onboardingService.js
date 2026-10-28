"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const index_js_1 = require("../repositories/index.js");
class OnboardingService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async seedContohData(usahaId) {
        await this.repo.isiContohData(usahaId);
    }
}
exports.OnboardingService = OnboardingService;
//# sourceMappingURL=onboardingService.js.map