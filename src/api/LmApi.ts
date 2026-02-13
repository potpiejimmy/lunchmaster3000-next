import HttpBase from "./HttpBase";

export default class LmApi extends HttpBase {

    async createCommunity(community: any): Promise<any> {
        return this.post("/communities", community);
    }

    getCommunity(id: string): Promise<any> {
        return this.get("/communities/"+id);
    }

    getData(): Promise<any> {
        return this.get("/data?id="+localStorage.getItem("id"));
    }

    saveLocation(location: any): Promise<any> {
        return this.post("/locations?id=" + localStorage.getItem("id"), location);
    }

    deleteLocation(location: any): Promise<any> {
        return this.delete("/locations/" + location.id + "?id=" + localStorage.getItem("id"));
    }

    setFavorite(locationId: number, name: string, checked: boolean): Promise<any> {
        return this.post("/favorites?id=" + localStorage.getItem("id"), {
            locationId,
            name,
            checked,
        });
    }

    createOrderSet(location: any, name: string, payLink: string): Promise<any> {
        return this.post("/ordersets?id=" + localStorage.getItem("id"), {
            location,
            name,
            payLink,
            fee: location.delivery_fee,
        });
    }

    deleteOrderSet(id: string): Promise<any> {
        return this.delete("/ordersets/" + id + "?id=" + localStorage.getItem("id"));
    }

    updateOrderSet(id: string, finish: boolean = false, arrive: boolean = false): Promise<any> {
        return this.put("/ordersets/" + id + "?id=" + localStorage.getItem("id"), {
            finish,
            arrive,
        });
    }

    updateOrderSetComment(id: string, orderSet: any): Promise<any> {
        return this.put("/ordersets/" + id + "?id=" + localStorage.getItem("id"), orderSet);
    }

    setOrder(ordersetId: string, name: string, order: any): Promise<any> {
        return this.post("/orders?id=" + localStorage.getItem("id"), {
            ordersetId,
            name,
            order,
        });
    }

    sendChatMsg(ordersetId: string | null, name: string, msg: string): Promise<any> {
        const prefix = ordersetId ? `/ordersets/${ordersetId}/` : "/";
        return this.post(`${prefix}chat?id=` + localStorage.getItem("id"), {
            name,
            msg,
        });
    }
}
