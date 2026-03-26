import type { LocaleMessages } from "./types";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import tc from "./locales/tc.json";
import ko from "./locales/ko.json";
import es from "./locales/es.json";

function validate<T>(_: T): void {}
validate<LocaleMessages>(en);
validate<LocaleMessages>(zh);
validate<LocaleMessages>(tc);
validate<LocaleMessages>(ko);
validate<LocaleMessages>(es);
export {};
