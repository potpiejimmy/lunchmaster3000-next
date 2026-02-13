"use client";

import { useTranslation } from "react-i18next";

export default function Donate() {
    const { t } = useTranslation();
    const returnUrl = process.env.NEXT_PUBLIC_SHARE_URL || "http://localhost:3000";

    return (
        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" style={{display: "flex", verticalAlign: "middle"}}>
            <input type="hidden" name="cmd" value="_s-xclick" />
            <input type="hidden" name="hosted_button_id" value="6KJS5SZJ8REPW" />
            <input type="hidden" name="return" value={returnUrl} />
            <input
                type="image"
                src={t("general.donation_btn_source")}
                name="submit"
                title={t("general.donation_text")}
                alt="Donate with PayPal button"
            />
        </form>
    );
}
