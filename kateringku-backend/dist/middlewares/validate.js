"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const response_js_1 = require("../utils/response.js");
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const fieldErrors = {};
                for (const issue of error.errors) {
                    const key = issue.path.join('.') || 'root';
                    if (!fieldErrors[key])
                        fieldErrors[key] = [];
                    fieldErrors[key].push(issue.message);
                }
                const pesan = error.errors.map((e) => e.message).join(', ');
                return next(new response_js_1.AppError(pesan, 400, { fieldErrors, issues: error.errors }));
            }
            next(error);
        }
    };
}
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const fieldErrors = {};
                for (const issue of error.errors) {
                    const key = issue.path.join('.') || 'root';
                    if (!fieldErrors[key])
                        fieldErrors[key] = [];
                    fieldErrors[key].push(issue.message);
                }
                const pesan = error.errors.map((e) => e.message).join(', ');
                return next(new response_js_1.AppError(pesan, 400, { fieldErrors, issues: error.errors }));
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.js.map