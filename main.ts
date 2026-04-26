import { dofetch } from "./doFetch.ts";
import { findFilesWithExtension } from "./find.ts";
import { moveTo } from "./move.ts";


// const targetPath = "Z:\\Garage\\超新车";

const targetPath = "Z:\\Garage\\临时";
const host = `http://192.168.10.102:5000`;
const cookie = "list_mode=h; theme=auto; _ym_uid=1769518913550907572; _ym_d=1769518913; over18=1; locale=zh; cf_clearance=8Q2cblqi63J5wLi0_3eGV9PQe8P_GaRxUSbJBVgnJ5k-1774094569-1.2.1.1-xccGVUNjRzrs1eKm2Z4LPIl5OlcyDwt42FCpqgZUi4emg6i_XOa3Fyk5U5FPreG7XZ07iLCvOB6h.B8ETCYLH0P80N1u8XINd1JotjrioXhdAWEeOLnQ0J417lOk2Uoh66ItGnr6SIMCQeCv5wgxGbROVzBtsnsYaXU4oJ7HjwvSTGMoDRhmLWlfdjzh.6fhM94v10_UOujfOXLFpgPZKkr4Tv_WEDNYrqYWLTY5EsY; _jdb_session=ovD9%2FIb89ioqybvxEfSYccUUbAS1J7YJDxQBpN7vU%2BUi4MNuGMuFPaskXJ%2BVHA5Avj5XOsd%2F1t0DkTnK3UOyXH9nEKtF5QpyL25gO2AoWdiNzj3N2e0UTJSn7PI6FNl8nNXwiIu4KJiALGXPeT%2B5DR5jOo%2BHRES4FJcLw%2FszKSAFTAQB5et%2FyNbEHVx9cB%2FHCUkmxwiiZ55FWDUo3nX1U8mhjayPoxmOCUscqOU%2FBJ7N4ODPz0mlJ7%2FAi4cEdHwArXUOizhgh%2FMOzr2s9ri5X70TOSOVESI2vxA2FhUFekF2dnYkycI5yYLdPapO76v3oK74BAlKCpnOZ5IBgjquzv152JI%2FBi9Ly%2BP6Ab9n0%2F0qbn0YQnmNqOUkZDVWjMNVy%2BA%3D--GXCEjLzCaOshQUB6--GyV7aPg%2BMdMu2WTAHHj4Zg%3D%3D"
const extension = "mp4";

// dofetch(host, targetPath)

const mp4List = await findFilesWithExtension(targetPath, extension);
await moveTo(mp4List, targetPath);


// console.log(movedTo);
dofetch(host, targetPath, cookie)
