"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Snackbar,
  Slider,
  SvgIcon,
  SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import StarIcon from "@mui/icons-material/Star";
import { useRouter } from "next/navigation";
import AppContext from "../AppContext";
import InfoIcon from "@mui/icons-material/Info";
import ShareIcon from "@mui/icons-material/Share";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { io, Socket } from "socket.io-client";
import moment from "moment";
import Cropper, { Area, Point } from "react-easy-crop";

type OrderInputMap = Record<string, { order: string; price: string }>;
type AdminInputMap = Record<string, { comment: string; payLink: string; fee: string }>;
type ManualOrderInputMap = Record<string, { name: string; order: string; price: string }>;
type EditOrderEntryInputMap = Record<string, { order: string; price: string }>;

function ThinStarOutlineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M12 3.8l2.62 5.3 5.85.85-4.24 4.13 1 5.82L12 17.1 6.77 19.9l1-5.82-4.24-4.13 5.85-.85L12 3.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

export default function Main() {
  const context = React.useContext(AppContext);
  const { t } = useTranslation();
  const router = useRouter();

  const socketRef = useRef<Socket | null>(null);
  const orderTypingRef = useRef<Record<string, NodeJS.Timeout>>({});
  const adminTypingRef = useRef<Record<string, NodeJS.Timeout>>({});
  const orderInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const manualEntryNameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editOrderInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const orderSetCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const creatingOrderSetLocationIdsRef = useRef<Set<string>>(new Set());
  const pendingOpenOrderSetLocationIdsRef = useRef<Set<string>>(new Set());
  const pendingOpenOrderSetTimeoutsRef = useRef<Record<string, number>>({});
  const previousOrderSetIdsRef = useRef<string[]>([]);
  const locationEditorScrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const locationNameInputRef = useRef<HTMLInputElement | null>(null);
  const locationImageInputRef = useRef<HTMLInputElement | null>(null);
  const mainChatContainerRef = useRef<HTMLDivElement | null>(null);
  const orderChatContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentNameRef = useRef<string>("");

  const [data, setData] = useState<any>({ locations: [], ordersets: {}, chat: [] });
  const [typing, setTyping] = useState(false);
  const [locationEditor, setLocationEditor] = useState<any | null>(null);
  const [locationProcessing, setLocationProcessing] = useState(false);
  const [mainChatInput, setMainChatInput] = useState("");
  const [orderInputs, setOrderInputs] = useState<OrderInputMap>({});
  const [orderChatInputs, setOrderChatInputs] = useState<Record<string, string>>({});
  const [adminInputs, setAdminInputs] = useState<AdminInputMap>({});
  const [manualOrderInputs, setManualOrderInputs] = useState<ManualOrderInputMap>({});
  const [manualEntryEditors, setManualEntryEditors] = useState<Record<string, boolean>>({});
  const [editOrderEntries, setEditOrderEntries] = useState<Record<string, boolean>>({});
  const [editOrderEntryInputs, setEditOrderEntryInputs] = useState<EditOrderEntryInputMap>({});
  const [visibleEditLocationId, setVisibleEditLocationId] = useState<string | number | null>(null);
  const [pendingOrderSetDeletion, setPendingOrderSetDeletion] = useState<any | null>(null);
  const [pendingOrderEntryDeletion, setPendingOrderEntryDeletion] = useState<{ orderSet: any; entryName: string } | null>(null);
  const [pendingLocationDeletion, setPendingLocationDeletion] = useState<any | null>(null);
  const [creatingOrderSetLocationId, setCreatingOrderSetLocationId] = useState<string | null>(null);
  const [pendingOpenOrderSetLocationIds, setPendingOpenOrderSetLocationIds] = useState<string[]>([]);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [foregroundPush, setForegroundPush] = useState<{ open: boolean; title: string; body: string }>({
    open: false,
    title: "",
    body: "",
  });

  const currentName = context?.name || (typeof window !== "undefined" ? localStorage.getItem("name") : "") || "";
  const orderSets = useMemo(() => Object.values<any>(data.ordersets || {}), [data.ordersets]);
  const orderChatScrollSignature = useMemo(
    () => orderSets.map((orderSet: any) => `${orderSet.id}:${(orderSet.chat || []).length}`).join("|"),
    [orderSets],
  );

  useEffect(() => {
    currentNameRef.current = currentName;
  }, [currentName]);

  useEffect(() => {
    const currentIds = orderSets.map((orderSet: any) => String(orderSet.id));
    const addedIds = currentIds.filter((id) => !previousOrderSetIdsRef.current.includes(id));

    if (addedIds.length > 0) {
      const focusTarget = orderSets.find((orderSet: any) => addedIds.includes(String(orderSet.id)) && !orderSet.finished);
      if (focusTarget?.id) {
        window.setTimeout(() => {
          orderInputRefs.current[String(focusTarget.id)]?.focus();
        }, 10);
      }
    }

    previousOrderSetIdsRef.current = currentIds;
  }, [orderSets]);

  useEffect(() => {
    const openLocationIds = new Set(
      orderSets
        .filter((orderSet: any) => !orderSet?.finished)
        .map((orderSet: any) => String(orderSet?.location?.id || ""))
        .filter(Boolean),
    );

    let changed = false;
    for (const locationId of Array.from(pendingOpenOrderSetLocationIdsRef.current)) {
      if (!openLocationIds.has(locationId)) continue;
      pendingOpenOrderSetLocationIdsRef.current.delete(locationId);
      const timeoutId = pendingOpenOrderSetTimeoutsRef.current[locationId];
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        delete pendingOpenOrderSetTimeoutsRef.current[locationId];
      }
      changed = true;
    }

    if (changed) {
      setPendingOpenOrderSetLocationIds(Array.from(pendingOpenOrderSetLocationIdsRef.current));
    }
  }, [orderSets]);

  useEffect(() => {
    if (!locationEditor) return;

    const scrollDelay = window.setTimeout(() => {
      locationEditorScrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    const focusDelay = window.setTimeout(
      () => locationNameInputRef.current?.focus(),
      locationEditor?.id ? 900 : 400,
    );

    return () => {
      window.clearTimeout(scrollDelay);
      window.clearTimeout(focusDelay);
    };
  }, [Boolean(locationEditor), locationEditor?.id]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const container = mainChatContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [(data.chat || []).length]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      for (const orderSet of orderSets) {
        const container = orderChatContainerRefs.current[String(orderSet.id)];
        if (!container) continue;
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [orderChatScrollSignature, orderSets]);

  useEffect(() => {
    const currentSearch = new URLSearchParams(window.location.search);
    let id = currentSearch.get("id");
    const storedName = localStorage.getItem("name");

    if (id) localStorage.setItem("id", id);
    else id = localStorage.getItem("id");

    if (!id) {
      router.replace("/create");
      return;
    }

    context?.setLoading(true);
    context
      ?.api.getCommunity(id)
      .then(async (community: any) => {
        if (!community) {
          router.replace("/create");
          return;
        }

        context?.setCommunity(community);
        localStorage.setItem("community", JSON.stringify(community));
        if (!storedName) {
          router.replace("/welcome");
          return;
        }

        context?.setName(storedName);
        await startup(community.webid);
      })
      .finally(() => context?.setLoading(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [router]);

  async function startup(webid: string): Promise<void> {
    initSocket(webid);
    await load();
    await requestNotificationPermission();
  }

  async function requestNotificationPermission() {
    if (typeof window !== "undefined" && localStorage.getItem("notifications_enabled") === "false") {
      return;
    }

    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;

    try {
      await Notification.requestPermission();
    } catch {
      // noop
    }
  }

  async function showPushNotification(title: string, body: string, requireInteraction: boolean) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, {
            body,
            requireInteraction,
          });
          return;
        }
      } catch {
        // noop
      }
    }

    try {
      new Notification(title, {
        body,
        requireInteraction,
      });
    } catch {
      // noop
    }
  }

  function showForegroundPushMessage(title: string, body: string) {
    setForegroundPush({ open: true, title, body });
  }

  function initSocket(webid: string) {
    if (socketRef.current) socketRef.current.close();

    const socket = io((process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:3000/") + webid, {
      path: process.env.NEXT_PUBLIC_SOCKET_IO_PATH || "/api/socket.io",
    });
    socketRef.current = socket;

    socket.on("reconnect", async () => adaptDataFromServer(await context?.api.getData()));
    socket.on("data", (serverData) => {
      if (!typing) adaptDataFromServer(serverData);
    });
    socket.on("push", async (msg) => {
      if (!msg || msg.name === currentNameRef.current) return;
      if (typeof window !== "undefined" && localStorage.getItem("notifications_enabled") === "false") return;

      const body = msg.type !== "chat" ? t("push." + msg.body, msg.params) : msg.body;
      await showPushNotification(msg.title, body, msg.type !== "chat");

      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        showForegroundPushMessage(msg.title, body);
      }
    });

    socket.on("connect_error", (err) => {
      console.log(`socket.io connect error due to ${err.message}`);
    });
  }

  async function load(): Promise<void> {
    const loaded = await context?.api.getData();
    setData(loaded);
    hydrateInputs(loaded);
  }

  function hydrateInputs(currentData: any) {
    const nextOrderInputs: OrderInputMap = {};
    const nextAdminInputs: AdminInputMap = {};

    for (const orderSet of Object.values<any>(currentData?.ordersets || {})) {
      const ownOrder = orderSet?.orders?.[currentName];
      nextOrderInputs[orderSet.id] = {
        order: ownOrder?.order || "",
        price: ownOrder?.price?.toString?.() || "",
      };
      nextAdminInputs[orderSet.id] = {
        comment: orderSet?.comment || "",
        payLink: orderSet?.payLink || "",
        fee: orderSet?.fee?.toString?.() || "",
      };
    }

    setOrderInputs((old) => ({ ...nextOrderInputs, ...old }));
    setAdminInputs((old) => ({ ...nextAdminInputs, ...old }));
  }

  async function adaptDataFromServer(serverData: any) {
    setData((previous: any) => {
      const next = {
        ...previous,
        locations: serverData?.locations || [],
        chat: serverData?.chat || [],
        ordersets: { ...(previous?.ordersets || {}) },
      };

      for (const orderSet of Object.values<any>(serverData?.ordersets || {})) {
        if (!next.ordersets[orderSet.id]) next.ordersets[orderSet.id] = orderSet;
        else {
          const existing = next.ordersets[orderSet.id];
          existing.orders = orderSet.orders;
          existing.finished = orderSet.finished;
          existing.arrived = orderSet.arrived;
          existing.chat = orderSet.chat;
          existing.comment = orderSet.comment;
          existing.payLink = orderSet.payLink;
          existing.fee = orderSet.fee;
        }
      }

      for (const oldOrderSet of Object.values<any>(next.ordersets)) {
        if (!serverData?.ordersets?.[oldOrderSet.id]) delete next.ordersets[oldOrderSet.id];
      }

      hydrateInputs(next);
      return { ...next };
    });
  }

  function resourcesBaseUrl() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    return `${apiBase.replace(/\/+$/, "")}/resources`;
  }

  function openNewLocation() {
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setLocationEditor({ name: "", description: "", menu_link: "", delivery_fee: "" });
  }

  function openEditLocation(location: any) {
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setLocationEditor({
      id: location.id,
      name: location.name || "",
      description: location.description || "",
      menu_link: location.menu_link || "",
      delivery_fee: location.delivery_fee?.toString?.() || "",
      icon: location.icon,
    });
  }

  function cancelLocationEditor() {
    setLocationProcessing(false);
    setPendingLocationDeletion(null);
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setLocationEditor(null);
  }

  function onLocationImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function openLocationImagePicker() {
    locationImageInputRef.current?.click();
  }

  function onCropComplete(_: Area, areaPixels: Area) {
    setCroppedAreaPixels(areaPixels);
  }

  async function createImage(src: string): Promise<HTMLImageElement> {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      image.src = src;
    });
  }

  async function getCroppedImageDataUrl(imageSrc: string, areaPixels: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 80;

    const ctx = canvas.getContext("2d");
    if (!ctx) return imageSrc;

    ctx.drawImage(
      image,
      areaPixels.x,
      areaPixels.y,
      areaPixels.width,
      areaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async function applyCroppedImage() {
    if (!rawImageSrc || !croppedAreaPixels) return;
    const resizedImage = await getCroppedImageDataUrl(rawImageSrc, croppedAreaPixels);
    setLocationEditor((previous: any) => ({ ...previous, newIcon: resizedImage }));
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function saveLocation() {
    if (!locationEditor?.name?.trim()) return;
    setLocationProcessing(true);
    try {
      let newIcon = locationEditor.newIcon;
      if (rawImageSrc && croppedAreaPixels) {
        newIcon = await getCroppedImageDataUrl(rawImageSrc, croppedAreaPixels);
      }

      await context?.api.saveLocation({
        ...locationEditor,
        newIcon,
        name: locationEditor.name.trim(),
        delivery_fee: locationEditor.delivery_fee ? Number(locationEditor.delivery_fee) : 0,
      });
      cancelLocationEditor();
    } finally {
      setLocationProcessing(false);
    }
  }

  function openDeleteLocationConfirm() {
    if (!locationEditor?.id) return;
    setPendingLocationDeletion({ id: locationEditor.id, name: locationEditor.name || "" });
  }

  function closeDeleteLocationConfirm() {
    setPendingLocationDeletion(null);
  }

  async function confirmDeleteLocation() {
    if (!pendingLocationDeletion) return;
    const locationToDelete = pendingLocationDeletion;
    closeDeleteLocationConfirm();
    setLocationProcessing(true);
    try {
      await context?.api.deleteLocation(locationToDelete);
      cancelLocationEditor();
    } finally {
      setLocationProcessing(false);
    }
  }

  async function toggleFavorite(location: any, checked: boolean) {
    await context?.api.setFavorite(location.id, currentName, checked);
  }

  async function takeOrders(location: any) {
    const locationId = String(location?.id || "");
    if (!locationId) return;
    if (creatingOrderSetLocationIdsRef.current.has(locationId)) return;
    if (pendingOpenOrderSetLocationIdsRef.current.has(locationId)) return;
    if (creatingOrderSetLocationId === locationId) return;

    const openOrderSet = orderSets.find((orderSet: any) => !orderSet?.finished && String(orderSet?.location?.id || "") === locationId);
    if (openOrderSet?.id) {
      scrollToOrderSet(openOrderSet.id);
      return;
    }

    pendingOpenOrderSetLocationIdsRef.current.add(locationId);
    setPendingOpenOrderSetLocationIds(Array.from(pendingOpenOrderSetLocationIdsRef.current));
    creatingOrderSetLocationIdsRef.current.add(locationId);
    setCreatingOrderSetLocationId(locationId);
    let created = false;
    try {
      await context?.api.createOrderSet(location, currentName, localStorage.getItem("paylink") || "");
      created = true;
    } finally {
      creatingOrderSetLocationIdsRef.current.delete(locationId);
      setCreatingOrderSetLocationId(null);

      if (!created) {
        pendingOpenOrderSetLocationIdsRef.current.delete(locationId);
        setPendingOpenOrderSetLocationIds(Array.from(pendingOpenOrderSetLocationIdsRef.current));
        return;
      }

      const existingTimeout = pendingOpenOrderSetTimeoutsRef.current[locationId];
      if (existingTimeout) window.clearTimeout(existingTimeout);
      pendingOpenOrderSetTimeoutsRef.current[locationId] = window.setTimeout(() => {
        pendingOpenOrderSetLocationIdsRef.current.delete(locationId);
        delete pendingOpenOrderSetTimeoutsRef.current[locationId];
        setPendingOpenOrderSetLocationIds(Array.from(pendingOpenOrderSetLocationIdsRef.current));
      }, 8000);
    }
  }

  function scrollToOrderSet(orderSetId: string | number) {
    const target = orderSetCardRefs.current[String(orderSetId)];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onOrderInputChange(orderSetId: string, field: "order" | "price", value: string) {
    const normalizedValue = field === "price" ? sanitizeDecimalInput(value).slice(0, 7) : value;
    const next = {
      ...(orderInputs[orderSetId] || { order: "", price: "" }),
      [field]: normalizedValue,
    };

    setOrderInputs((previous) => ({ ...previous, [orderSetId]: next }));

    clearTimeout(orderTypingRef.current[orderSetId]);
    setTyping(true);
    orderTypingRef.current[orderSetId] = setTimeout(async () => {
      await context?.api.setOrder(orderSetId, currentName, {
        order: next.order,
        price: parseDecimalInput(next.price),
      });
      setTyping(false);
    }, 700);
  }

  function onManualOrderInputChange(orderSetId: string, field: "name" | "order" | "price", value: string) {
    const normalizedValue = field === "price" ? sanitizeDecimalInput(value).slice(0, 7) : value;
    setManualOrderInputs((previous) => ({
      ...previous,
      [orderSetId]: {
        ...(previous[orderSetId] || { name: "", order: "", price: "" }),
        [field]: normalizedValue,
      },
    }));
  }

  function orderEntryEditKey(orderSetId: string | number, entryName: string) {
    return `${String(orderSetId)}::${entryName}`;
  }

  function onEditOrderEntryInputChange(orderSetId: string | number, entryName: string, field: "order" | "price", value: string) {
    const key = orderEntryEditKey(orderSetId, entryName);
    const normalizedValue = field === "price" ? sanitizeDecimalInput(value).slice(0, 7) : value;
    setEditOrderEntryInputs((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || { order: "", price: "" }),
        [field]: normalizedValue,
      },
    }));
  }

  function openEditOrderEntry(orderSet: any, entryName: string, entryOrder: any) {
    if (entryName === currentName) return;
    const key = orderEntryEditKey(orderSet.id, entryName);
    setEditOrderEntries((previous) => ({ ...previous, [key]: true }));
    setEditOrderEntryInputs((previous) => ({
      ...previous,
      [key]: {
        order: entryOrder?.order || "",
        price: entryOrder?.price?.toString?.() || "",
      },
    }));

    window.setTimeout(() => {
      const input = editOrderInputRefs.current[key];
      input?.focus();
      input?.select();
    }, 0);
  }

  function closeEditOrderEntry(orderSetId: string | number, entryName: string) {
    const key = orderEntryEditKey(orderSetId, entryName);
    setEditOrderEntries((previous) => ({ ...previous, [key]: false }));
    setEditOrderEntryInputs((previous) => ({
      ...previous,
      [key]: { order: "", price: "" },
    }));
  }

  async function saveEditOrderEntry(orderSet: any, entryName: string) {
    if (entryName === currentName) return;

    const key = orderEntryEditKey(orderSet.id, entryName);
    const input = editOrderEntryInputs[key] || { order: "", price: "" };
    const orderText = input.order.trim();

    if (!orderText) {
      await context?.api.setOrder(orderSet.id, entryName, {});
      closeEditOrderEntry(orderSet.id, entryName);
      return;
    }

    const existingOrder = orderSet?.orders?.[entryName] || {};
    await context?.api.setOrder(orderSet.id, entryName, {
      ...existingOrder,
      order: orderText,
      price: parseDecimalInput(input.price),
    });
    closeEditOrderEntry(orderSet.id, entryName);
  }

  function openManualEntryEditor(orderSetId: string) {
    setManualEntryEditors((previous) => ({ ...previous, [orderSetId]: true }));
    setManualOrderInputs((previous) => ({
      ...previous,
      [orderSetId]: previous[orderSetId] || { name: "", order: "", price: "" },
    }));

    window.setTimeout(() => {
      const input = manualEntryNameInputRefs.current[String(orderSetId)];
      input?.focus();
      input?.select();
    }, 0);
  }

  function closeManualEntryEditor(orderSetId: string) {
    setManualEntryEditors((previous) => ({ ...previous, [orderSetId]: false }));
    setManualOrderInputs((previous) => ({
      ...previous,
      [orderSetId]: { name: "", order: "", price: "" },
    }));
  }

  async function addManualOrderEntry(orderSet: any) {
    const editorInput = manualOrderInputs[orderSet.id] || { name: "", order: "", price: "" };
    const entryName = editorInput.name.trim();
    const entryOrder = editorInput.order.trim();
    if (!entryName || !entryOrder) return;

    const existingOrder = orderSet?.orders?.[entryName] || {};
    await context?.api.setOrder(orderSet.id, entryName, {
      ...existingOrder,
      order: entryOrder,
      price: parseDecimalInput(editorInput.price),
    });

    setManualOrderInputs((previous) => ({
      ...previous,
      [orderSet.id]: { name: "", order: "", price: "" },
    }));
    setManualEntryEditors((previous) => ({ ...previous, [orderSet.id]: false }));
  }

  function onAdminInputChange(orderSetId: string, field: "comment" | "payLink" | "fee", value: string) {
    const normalizedValue = field === "fee" ? sanitizeDecimalInput(value).slice(0, 7) : value;
    const next = {
      ...(adminInputs[orderSetId] || { comment: "", payLink: "", fee: "" }),
      [field]: normalizedValue,
    };

    setAdminInputs((previous) => ({ ...previous, [orderSetId]: next }));

    clearTimeout(adminTypingRef.current[orderSetId]);
    setTyping(true);
    adminTypingRef.current[orderSetId] = setTimeout(async () => {
      localStorage.setItem("paylink", next.payLink || "");
      await context?.api.updateOrderSetComment(orderSetId, {
        comment: next.comment,
        payLink: next.payLink,
        fee: parseDecimalInput(next.fee),
      });
      setTyping(false);
    }, 700);
  }

  function sanitizeDecimalInput(value: string): string {
    return (value || "").replace(/[^\d.,]/g, "");
  }

  function parseDecimalInput(value: string): number {
    const sanitized = sanitizeDecimalInput(value).trim();
    if (!sanitized) return 0;

    const separators = sanitized.match(/[.,]/g) || [];
    if (separators.length === 0) {
      const parsed = Number(sanitized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const lastSeparatorIndex = Math.max(sanitized.lastIndexOf("."), sanitized.lastIndexOf(","));
    const integerPart = sanitized.slice(0, lastSeparatorIndex).replace(/[.,]/g, "");
    const decimalPart = sanitized.slice(lastSeparatorIndex + 1).replace(/[.,]/g, "");
    const normalized = `${integerPart || "0"}.${decimalPart}`;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function finishOrderSet(orderSetId: string) {
    await context?.api.updateOrderSet(orderSetId, true);
  }

  async function reopenOrderSet(orderSetId: string) {
    await context?.api.updateOrderSet(orderSetId, false, false);
  }

  async function arriveOrderSet(orderSetId: string) {
    await context?.api.updateOrderSet(orderSetId, true, true);
  }

  async function deleteOrderSet(orderSet: any) {
    await context?.api.deleteOrderSet(orderSet.id);
  }

  function openDeleteOrderSetConfirm(orderSet: any) {
    setPendingOrderSetDeletion(orderSet);
  }

  function closeDeleteOrderSetConfirm() {
    setPendingOrderSetDeletion(null);
  }

  async function confirmDeleteOrderSet() {
    if (!pendingOrderSetDeletion) return;
    const orderSet = pendingOrderSetDeletion;
    closeDeleteOrderSetConfirm();
    await deleteOrderSet(orderSet);
  }

  async function toggleMoneyReceived(orderSet: any, userName: string, checked: boolean) {
    const updatedOrder = { ...(orderSet.orders?.[userName] || {}), moneyReceived: checked };
    await context?.api.setOrder(orderSet.id, userName, updatedOrder);
  }

  async function deleteOrderEntry(orderSet: any, entryName: string) {
    if (entryName === currentName) return;
    await context?.api.setOrder(orderSet.id, entryName, {});
  }

  function openDeleteOrderEntryConfirm(orderSet: any, entryName: string) {
    if (entryName === currentName) return;
    setPendingOrderEntryDeletion({ orderSet, entryName });
  }

  function closeDeleteOrderEntryConfirm() {
    setPendingOrderEntryDeletion(null);
  }

  async function confirmDeleteOrderEntry() {
    if (!pendingOrderEntryDeletion) return;
    const { orderSet, entryName } = pendingOrderEntryDeletion;
    closeDeleteOrderEntryConfirm();
    await deleteOrderEntry(orderSet, entryName);
  }

  async function sendMainChat() {
    const msg = mainChatInput.trim();
    if (!msg) return;
    await context?.api.sendChatMsg(null, currentName, msg);
    setMainChatInput("");
  }

  async function sendOrderChat(orderSetId: string) {
    const msg = (orderChatInputs[orderSetId] || "").trim();
    if (!msg) return;
    await context?.api.sendChatMsg(orderSetId, currentName, msg);
    setOrderChatInputs((previous) => ({ ...previous, [orderSetId]: "" }));
  }

  function feePerPerson(orderSet: any) {
    const fee = Number(orderSet?.fee || 0);
    const participants = Object.keys(orderSet?.orders || {}).length;
    if (!fee || !participants) return 0;
    return participants > 1 ? Math.ceil((fee / participants) * 100) / 100 : fee;
  }

  function totalPerPerson(orderSet: any, price: number) {
    return Number(price || 0) + feePerPerson(orderSet);
  }

  function orderSetSum(orderSet: any) {
    const ordersSum = Object.values<any>(orderSet?.orders || {}).reduce(
      (sum, entryOrder) => sum + Number(entryOrder?.price || 0),
      0,
    );
    return ordersSum + Number(orderSet?.fee || 0);
  }

  function formatMoney(value: number) {
    return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(value: string) {
    return (value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function printOrderList(orderSet: any) {
    const fee = feePerPerson(orderSet);
    const sum = orderSetSum(orderSet);
    const rows = Object.entries<any>(orderSet?.orders || {})
      .map(([entryName, entryOrder]) => {
        const total = totalPerPerson(orderSet, Number(entryOrder?.price || 0));
        return `
          <tr>
            <td>${escapeHtml(entryName)}</td>
            <td>${escapeHtml(entryOrder?.order || "")}</td>
            <td class="right">${escapeHtml(formatMoney(Number(entryOrder?.price || 0)))}</td>
            <td class="right">${escapeHtml(formatMoney(fee))}</td>
            <td class="right"><b>${escapeHtml(formatMoney(total))}</b></td>
            <td>${entryOrder?.moneyReceived ? "✓" : ""}</td>
          </tr>`;
      })
      .join("");

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;

    popup.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(orderSet.location?.name || "Order List")}</title>
        <style>
          body { font-family: 'PT Sans', Arial, sans-serif; padding: 20px; color: #212121; }
          h1 { margin: 0 0 6px 0; font-size: 24px; }
          .sub { margin: 0 0 16px 0; color: #555; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d0d0d0; padding: 8px; text-align: left; font-size: 14px; }
          th { background: #f3f3f3; font-weight: 700; }
          .right { text-align: right; }
          .sum-wrap { margin-top: 10px; text-align: right; }
          .sum { font-size: 16px; font-weight: 700; }
          .fee-note { font-size: 12px; color: #555; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(orderSet.location?.name || "Order List")}</h1>
        <p class="sub">${escapeHtml(t("components.orderset.subtitle_1", { name: orderSet.name, location: orderSet.location?.name || "" }))}</p>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(t("general.name"))}</th>
              <th>${escapeHtml(t("components.orderset.user_order_request"))}</th>
              <th class="right">${escapeHtml(t("components.orderset.price"))}</th>
              <th class="right">${escapeHtml(t("general.fee"))}</th>
              <th class="right">${escapeHtml(t("components.orderset.total"))}</th>
              <th>${escapeHtml(t("components.orderset.money_received"))}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="sum-wrap">
          ${sum > 0 ? `<div class="sum">${escapeHtml(t("components.orderset.sum"))}: ${escapeHtml(formatMoney(sum))}</div>` : ""}
          ${Number(orderSet?.fee || 0) > 0 ? `<div class="fee-note">${escapeHtml(t("components.orderset.incl_fee"))}: ${escapeHtml(formatMoney(Number(orderSet.fee || 0)))}</div>` : ""}
        </div>
      </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  if (context?.serverUnavailable) {
    return (
      <Card sx={{ backgroundColor: "warning.light", border: "1px solid", borderColor: "warning.main" }}>
        <CardContent sx={{ py: { xs: 4, sm: 5 } }}>
          <Box className="flex flex-col gap-3 items-start">
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("routes.main.server_unavailable_title")}
            </Typography>
            <Typography sx={{ fontSize: { xs: "1.05rem", sm: "1.2rem" }, lineHeight: 1.5 }}>
              {t("routes.main.server_unavailable_text")}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="flex flex-col gap-4">
      {orderSets.map((orderSet: any) => {
        const isOwn = orderSet?.name === currentName;
        const hasArrived = Boolean(orderSet?.arrived);
        const orderEntries = Object.entries<any>(orderSet?.orders || {});
        const headerImage = orderSet.location?.icon ? `${resourcesBaseUrl()}/${orderSet.location.icon}.png` : "/assets/placeholder.jpg";
        const manualEntryInput = manualOrderInputs[orderSet.id] || { name: "", order: "", price: "" };
        const isManualEditorOpen = Boolean(manualEntryEditors[orderSet.id]);
        const canManageEntries = isOwn && orderSet.finished && !orderSet.arrived;
        const orderListGridTemplateColumns = `minmax(0,1fr) minmax(0,2fr) minmax(72px,.7fr) minmax(72px,.7fr) minmax(78px,.8fr) minmax(96px,1fr) ${canManageEntries ? "minmax(96px,.95fr)" : "0px"}`;

        return (
          <Card
            key={orderSet.id}
            ref={(element: HTMLDivElement | null) => {
              orderSetCardRefs.current[String(orderSet.id)] = element;
            }}
            sx={{ backgroundColor: "#e7f1e4" }}
          >
            <CardContent>
              <Box className="flex flex-col lg:flex-row gap-3 lg:gap-2">
                <Box className="w-full lg:w-[70%] flex flex-col gap-3">
                  <Box className="flex flex-row items-start gap-3" sx={{ mb: 0.5 }}>
                    <Box sx={{ ml: 1, flexShrink: 0, width: 120, minWidth: 120 }}>
                      <img
                        src={headerImage}
                        alt={orderSet.location?.name || "location"}
                        width={120}
                        height={80}
                        style={{ width: 120, height: 80, objectFit: "cover", display: "block" }}
                      />
                    </Box>
                    <Box className="grow">
                      <Typography sx={{ fontSize: "1.35rem", lineHeight: 1.25, fontWeight: 500 }}>{orderSet.location?.name}</Typography>
                      {orderSet.location?.description && <Typography sx={{ color: "text.secondary", m: 0 }}>{orderSet.location.description}</Typography>}
                      {orderSet.location?.menu_link && (
                        <Link
                          target="_blank"
                          href={orderSet.location.menu_link}
                          underline="none"
                          sx={{ fontSize: "1rem", color: "primary.main", "&:visited": { color: "primary.main" } }}
                        >
                          {t("general.menucard")}
                        </Link>
                      )}
                    </Box>
                  </Box>

                  <Typography sx={{ color: "text.secondary" }}>
                    {t("components.orderset.subtitle_1", { name: orderSet.name, location: orderSet.location?.name })}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>{t("components.orderset.subtitle_2")}</Typography>

                  {isOwn && (
                    <Box className="flex flex-col gap-2">
                      <TextField
                        name="order-comment"
                        variant="standard"
                        label={t("components.orderset.comment")}
                        value={adminInputs[orderSet.id]?.comment || ""}
                        onChange={(event) => onAdminInputChange(orderSet.id, "comment", event.target.value)}
                      />
                      <Box className="flex flex-col sm:flex-row gap-3">
                        <TextField
                          name="order-paylink"
                          fullWidth
                          variant="standard"
                          label={t("components.orderset.paylink")}
                          value={adminInputs[orderSet.id]?.payLink || ""}
                          onChange={(event) => onAdminInputChange(orderSet.id, "payLink", event.target.value)}
                        />
                        <TextField
                            name="order-fee"
                            variant="standard"
                            type="text"
                            inputProps={{ inputMode: "decimal", maxLength: 7, style: { textAlign: "right" } }}
                          label={t("general.fee")}
                          value={adminInputs[orderSet.id]?.fee || ""}
                          onChange={(event) => onAdminInputChange(orderSet.id, "fee", event.target.value)}
                        />
                      </Box>
                    </Box>
                  )}

                  {Boolean(orderSet.comment) && (
                    <Card sx={{ backgroundColor: "white", m: 0, mb: 1 }}>
                      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 0.5 }}>
                          {t("components.orderset.subtitle_infos", { name: orderSet.name })}:
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-line" }}>{orderSet.comment}</Typography>
                      </CardContent>
                    </Card>
                  )}

                  {!orderSet.finished && (
                    <Card className="highlightedCard" sx={{ backgroundColor: "#fafad2", m: 0, mb: 1 }}>
                      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <EditIcon sx={{ fontSize: "1.1rem", mr: 0.5 }} />
                          {t("components.orderset.yourorder")}
                        </Typography>
                        <Box className="flex flex-col sm:flex-row gap-3">
                          <TextField
                            name="order-item"
                            fullWidth
                            variant="standard"
                            label={isOwn ? t("components.orderset.ownorder_1") : t("components.orderset.ownorder_2")}
                            inputRef={(element) => {
                              orderInputRefs.current[String(orderSet.id)] = element;
                            }}
                            value={orderInputs[orderSet.id]?.order || ""}
                            onChange={(event) => onOrderInputChange(orderSet.id, "order", event.target.value)}
                          />
                          <TextField
                            name="order-price"
                            variant="standard"
                            type="text"
                            inputProps={{ inputMode: "decimal", maxLength: 7, style: { textAlign: "right" } }}
                            label={t("components.orderset.price")}
                            value={orderInputs[orderSet.id]?.price || ""}
                            onChange={(event) => onOrderInputChange(orderSet.id, "price", event.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  <Card sx={{ backgroundColor: "white", m: 0, mb: 1 }}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box className="flex flex-row items-center">
                        <Typography variant="h6">{t("components.orderset.list")}</Typography>
                        <Box className="grow" />
                        <IconButton size="small" title={t("general.print")} onClick={() => printOrderList(orderSet)}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Box
                        className="hidden sm:grid gap-1 pb-1 border-b border-gray-300"
                        sx={{
                          gridTemplateColumns: orderListGridTemplateColumns,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0 }}>{t("general.name")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0 }}>{t("components.orderset.user_order_request")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right" }}>{t("components.orderset.price")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right" }}>{t("general.fee")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right" }}>{t("components.orderset.total")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right" }}>{t("components.orderset.money_received")}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right" }}>&nbsp;</Typography>
                      </Box>
                      <Box className="flex flex-col gap-0">
                        {orderEntries.map(([entryName, entryOrder]) => {
                          const entryEditKey = orderEntryEditKey(orderSet.id, entryName);
                          const isEntryEditing = Boolean(editOrderEntries[entryEditKey]);
                          const editInput = editOrderEntryInputs[entryEditKey] || {
                            order: entryOrder?.order || "",
                            price: entryOrder?.price?.toString?.() || "",
                          };
                          const displayedPrice = isEntryEditing ? parseDecimalInput(editInput.price) : Number(entryOrder?.price || 0);
                          const fee = feePerPerson(orderSet);
                          const total = totalPerPerson(orderSet, displayedPrice);
                          const showPayNow = orderSet.finished && orderSet.payLink && entryName === currentName && orderSet.name !== currentName && total > 0;

                          return (
                            <Box key={`${orderSet.id}-${entryName}`} className="border-b border-gray-200">
                              <Box
                                className="hidden sm:grid items-center gap-1"
                                sx={{
                                  gridTemplateColumns: orderListGridTemplateColumns,
                                  minHeight: 44,
                                }}
                              >
                                <Typography noWrap title={entryName} sx={{ minWidth: 0 }}><b>{entryName}</b></Typography>
                                {isEntryEditing ? (
                                  <TextField
                                    fullWidth
                                    variant="standard"
                                    value={editInput.order}
                                    inputRef={(element) => {
                                      editOrderInputRefs.current[entryEditKey] = element;
                                    }}
                                    onChange={(event) => onEditOrderEntryInputChange(orderSet.id, entryName, "order", event.target.value)}
                                    onKeyDown={(event) => (event.key === "Enter" ? saveEditOrderEntry(orderSet, entryName) : undefined)}
                                  />
                                ) : (
                                  <Typography noWrap title={entryOrder?.order || ""} sx={{ minWidth: 0 }}>{entryOrder?.order || ""}</Typography>
                                )}
                                {isEntryEditing ? (
                                  <TextField
                                    variant="standard"
                                    type="text"
                                    inputProps={{ inputMode: "decimal", maxLength: 7, style: { textAlign: "right" } }}
                                    value={editInput.price}
                                    onChange={(event) => onEditOrderEntryInputChange(orderSet.id, entryName, "price", event.target.value)}
                                    onKeyDown={(event) => (event.key === "Enter" ? saveEditOrderEntry(orderSet, entryName) : undefined)}
                                  />
                                ) : (
                                  <Typography sx={{ textAlign: "right" }}>{formatMoney(Number(entryOrder?.price || 0))}</Typography>
                                )}
                                <Typography sx={{ textAlign: "right" }}>{formatMoney(fee)}</Typography>
                                <Box sx={{ textAlign: "right" }}>
                                  <Typography sx={{ textAlign: "right" }}><b>{formatMoney(total)}</b></Typography>
                                  {showPayNow && (
                                    <Link href={`${orderSet.payLink}/${Math.round(total * 100) / 100}`} target="_blank">
                                      {t("components.orderset.pay_now")}
                                    </Link>
                                  )}
                                </Box>
                                <Box sx={{ minHeight: 42, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                  {orderSet.finished && entryName !== orderSet.name && (
                                    <Checkbox
                                      size="small"
                                      checked={Boolean(entryOrder?.moneyReceived)}
                                      disabled={!isOwn}
                                      onChange={(event) => toggleMoneyReceived(orderSet, entryName, event.target.checked)}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ minHeight: 42, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                  {canManageEntries && entryName !== currentName && !isEntryEditing && (
                                    <>
                                      <IconButton
                                        size="small"
                                        title={t("general.edit")}
                                        onClick={() => openEditOrderEntry(orderSet, entryName, entryOrder)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        title={t("general.delete")}
                                        onClick={() => openDeleteOrderEntryConfirm(orderSet, entryName)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                  {canManageEntries && entryName !== currentName && isEntryEditing && (
                                    <>
                                      <IconButton
                                        size="small"
                                        title={t("general.save")}
                                        onClick={() => saveEditOrderEntry(orderSet, entryName)}
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        title={t("general.cancel")}
                                        onClick={() => closeEditOrderEntry(orderSet.id, entryName)}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </Box>

                              <Box className="sm:hidden flex flex-col gap-1">
                                <Typography><b>{entryName}</b></Typography>
                                {isEntryEditing ? (
                                  <TextField
                                    fullWidth
                                    variant="standard"
                                    value={editInput.order}
                                    inputRef={(element) => {
                                      editOrderInputRefs.current[entryEditKey] = element;
                                    }}
                                    onChange={(event) => onEditOrderEntryInputChange(orderSet.id, entryName, "order", event.target.value)}
                                    onKeyDown={(event) => (event.key === "Enter" ? saveEditOrderEntry(orderSet, entryName) : undefined)}
                                  />
                                ) : (
                                  <Typography>{entryOrder?.order || ""}</Typography>
                                )}
                                {isEntryEditing ? (
                                  <TextField
                                    variant="standard"
                                    type="text"
                                    inputProps={{ inputMode: "decimal", maxLength: 7, style: { textAlign: "right" } }}
                                    value={editInput.price}
                                    onChange={(event) => onEditOrderEntryInputChange(orderSet.id, entryName, "price", event.target.value)}
                                    onKeyDown={(event) => (event.key === "Enter" ? saveEditOrderEntry(orderSet, entryName) : undefined)}
                                  />
                                ) : (
                                  <Typography variant="caption">{t("components.orderset.price")}: {formatMoney(Number(entryOrder?.price || 0))}</Typography>
                                )}
                                <Typography variant="caption">{t("general.fee")}: {formatMoney(fee)}</Typography>
                                <Typography variant="caption"><b>{t("components.orderset.total")}: {formatMoney(total)}</b></Typography>
                                {showPayNow && (
                                  <Link href={`${orderSet.payLink}/${Math.round(total * 100) / 100}`} target="_blank">
                                    {t("components.orderset.pay_now")}
                                  </Link>
                                )}
                                {orderSet.finished && entryName !== orderSet.name && (
                                  <Box className="flex flex-row items-center">
                                    <Checkbox
                                      checked={Boolean(entryOrder?.moneyReceived)}
                                      disabled={!isOwn}
                                      onChange={(event) => toggleMoneyReceived(orderSet, entryName, event.target.checked)}
                                    />
                                    <Typography variant="caption">{t("components.orderset.money_received")}</Typography>
                                  </Box>
                                )}
                                {canManageEntries && entryName !== currentName && !isEntryEditing && (
                                  <Box className="flex flex-row items-center">
                                    <Typography variant="caption">{t("general.edit")}</Typography>
                                    <IconButton
                                      size="small"
                                      title={t("general.edit")}
                                      onClick={() => openEditOrderEntry(orderSet, entryName, entryOrder)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="caption">{t("general.delete")}</Typography>
                                    <IconButton
                                      size="small"
                                      title={t("general.delete")}
                                      onClick={() => openDeleteOrderEntryConfirm(orderSet, entryName)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                                {canManageEntries && entryName !== currentName && isEntryEditing && (
                                  <Box className="flex flex-row items-center">
                                    <Typography variant="caption">{t("general.save")}</Typography>
                                    <IconButton
                                      size="small"
                                      title={t("general.save")}
                                      onClick={() => saveEditOrderEntry(orderSet, entryName)}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="caption">{t("general.cancel")}</Typography>
                                    <IconButton
                                      size="small"
                                      title={t("general.cancel")}
                                      onClick={() => closeEditOrderEntry(orderSet.id, entryName)}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        {orderSetSum(orderSet) > 0 && (
                          <Typography sx={{ fontSize: "1.15rem", fontWeight: 700 }}>
                            {t("components.orderset.sum")}: {formatMoney(orderSetSum(orderSet))}
                          </Typography>
                        )}
                        {Number(orderSet?.fee || 0) > 0 && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                            {t("components.orderset.incl_fee")}: {formatMoney(Number(orderSet.fee || 0))}
                          </Typography>
                        )}
                      </Box>

                      {canManageEntries && (
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                          {!isManualEditorOpen && (
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openManualEntryEditor(orderSet.id)}>
                              {t("components.orderset.add_entry")}
                            </Button>
                          )}

                          {isManualEditorOpen && (
                            <Box className="flex flex-col gap-2">
                              <Box className="flex flex-col sm:flex-row gap-3">
                                <TextField
                                  name="manual-entry-name"
                                  fullWidth
                                  variant="standard"
                                  label={t("general.name")}
                                  inputRef={(element) => {
                                    manualEntryNameInputRefs.current[String(orderSet.id)] = element;
                                  }}
                                  value={manualEntryInput.name}
                                  onChange={(event) => onManualOrderInputChange(orderSet.id, "name", event.target.value)}
                                />
                                <TextField
                                  name="manual-entry-order"
                                  fullWidth
                                  variant="standard"
                                  label={t("components.orderset.user_order_request")}
                                  value={manualEntryInput.order}
                                  onChange={(event) => onManualOrderInputChange(orderSet.id, "order", event.target.value)}
                                />
                                <TextField
                                  name="manual-entry-price"
                                  variant="standard"
                                  type="text"
                                  inputProps={{ inputMode: "decimal", maxLength: 7, style: { textAlign: "right" } }}
                                  label={t("components.orderset.price")}
                                  value={manualEntryInput.price}
                                  onChange={(event) => onManualOrderInputChange(orderSet.id, "price", event.target.value)}
                                />
                              </Box>

                              <Box className="flex flex-row gap-2">
                                <Button
                                  variant="contained"
                                  onClick={() => addManualOrderEntry(orderSet)}
                                  disabled={!manualEntryInput.name.trim() || !manualEntryInput.order.trim()}
                                >
                                  {t("general.save")}
                                </Button>
                                <Button variant="outlined" onClick={() => closeManualEntryEditor(orderSet.id)}>
                                  {t("general.cancel")}
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {orderSet.finished && (
                    <Card sx={{ m: 0, mb: 0.5, backgroundColor: "#2E7D32", color: "white" }}>
                      <CardContent sx={{ py: 1.2, "&:last-child": { pb: 1.2 } }}>
                        {!hasArrived && (
                          <Typography>
                            {t("components.orderset.order_finished")} {isOwn ? t("components.orderset.order_finished_own") : t("components.orderset.order_finished_not_own")}
                          </Typography>
                        )}
                        {hasArrived && (
                          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", color: "white" }}>
                            <LocationOnIcon sx={{ mr: 0.5 }} />
                            {t("components.orderset.food_arrived_msg")}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Box className="flex flex-row flex-wrap gap-2">
                    {isOwn && !orderSet.finished && orderEntries.length > 0 && (
                      <Button variant="contained" onClick={() => finishOrderSet(orderSet.id)}>
                        {t("components.orderset.finish_order")}
                      </Button>
                    )}
                    {isOwn && orderSet.finished && !orderSet.arrived && (
                      <Button variant="contained" onClick={() => arriveOrderSet(orderSet.id)}>
                        {t("components.orderset.food_arrived_btn")}
                      </Button>
                    )}
                    {isOwn && orderSet.finished && (
                      <Button variant="outlined" onClick={() => reopenOrderSet(orderSet.id)}>
                        {t("components.orderset.order_reopen")}
                      </Button>
                    )}
                    {isOwn && (
                      <Button color="error" variant="outlined" onClick={() => openDeleteOrderSetConfirm(orderSet)}>
                        {t("components.orderset.order_delete")}
                      </Button>
                    )}
                  </Box>
                </Box>

                <Box className="w-full lg:w-[30%]">
                  <Card className="highlightedCard" sx={{ backgroundColor: "#fafad2", m: 0 }}>
                    <CardContent>
                      <Typography variant="h6">{t("components.orderset.chat")}</Typography>
                      <Box
                        ref={(element: HTMLDivElement | null) => {
                          orderChatContainerRefs.current[String(orderSet.id)] = element;
                        }}
                        className="max-h-64 overflow-auto my-2 flex flex-col gap-2"
                      >
                        {(orderSet.chat || []).map((msg: any, index: number) => (
                          <Box key={`${orderSet.id}-chat-${index}`}>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {msg.name} [{moment(msg.date).fromNow()}]
                            </Typography>
                            <Typography>{msg.msg}</Typography>
                          </Box>
                        ))}
                      </Box>
                      <Box className="flex flex-row items-center gap-2">
                        <TextField
                          fullWidth
                          variant="standard"
                          label={t("components.orderset.chat_msg")}
                          value={orderChatInputs[orderSet.id] || ""}
                          onChange={(event) => setOrderChatInputs((previous) => ({ ...previous, [orderSet.id]: event.target.value }))}
                          onKeyDown={(event) => (event.key === "Enter" ? sendOrderChat(orderSet.id) : undefined)}
                        />
                        <IconButton onClick={() => sendOrderChat(orderSet.id)}>
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      <Box className="flex flex-col lg:flex-row gap-4 lg:gap-2">
        <Card className="w-full lg:w-[70%]">
          <CardContent>
            <Typography gutterBottom variant="h5">
              <Box className="flex flex-row items-center gap-1">
                <StarIcon />
                {t("routes.main.favorite_list")}
              </Box>
            </Typography>

            <Box className="flex flex-col gap-4">
            {data?.locations?.length > 0 && (
              <Box>
                <Typography sx={{ color: "text.secondary" }} gutterBottom>
                  {t("routes.main.hello", { name: currentName })}
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                  {t("routes.main.welcome_text_1")}
                  <br />
                  {t("routes.main.welcome_text_2")} <i>{t("routes.main.welcome_text_3")}</i>. {t("routes.main.welcome_text_4")}
                </Typography>
              </Box>
            )}

            {(!data?.locations?.length && !context?.loading) && (
              <Card>
                <CardContent className="highlightedCard">
                  <Typography sx={{ color: "text.secondary" }} gutterBottom>
                    <InfoIcon />&nbsp;{t("routes.main.community_new")}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }} gutterBottom>
                    {t("routes.main.invite_colleagues_1")}&nbsp;<ShareIcon fontSize="small" />&nbsp;
                    {t("routes.main.invite_colleagues_2")} {t("routes.main.invite_colleagues_3")} {t("routes.main.invite_colleagues_4")}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>{t("routes.main.invite_colleagues_5")}</Typography>
                </CardContent>
              </Card>
            )}

            <Box className="flex flex-col gap-2">
              {(data.locations || []).map((location: any) => {
                const checked = (location.votes || []).includes(currentName);
                const locationImage = location.icon ? `${resourcesBaseUrl()}/${location.icon}.png` : "/assets/placeholder.jpg";
                const showEdit = visibleEditLocationId === location.id;
                const locationId = String(location.id);
                const openOrderSetForLocation = orderSets.find(
                  (orderSet: any) => !orderSet?.finished && String(orderSet?.location?.id || "") === locationId,
                );
                const hasPendingOpenOrderSet = pendingOpenOrderSetLocationIds.includes(locationId);
                const hasOrderingInProgress = Boolean(openOrderSetForLocation) || hasPendingOpenOrderSet;
                const isCreatingOrderSet = creatingOrderSetLocationId === locationId;

                return (
                  <Box key={location.id} className="border-b border-gray-200 pb-3">
                    <Box className="flex flex-row items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onChange={(event) => toggleFavorite(location, event.target.checked)}
                        icon={<ThinStarOutlineIcon />}
                        checkedIcon={<StarIcon />}
                        sx={{
                          p: 0,
                          m: 0,
                          color: "text.disabled",
                          "&.Mui-checked": { color: "warning.main" },
                          "& .MuiSvgIcon-root": { fontSize: "3rem" },
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(location, !checked)}
                        className="hidden sm:block border-0 bg-transparent p-0 cursor-pointer shrink-0"
                        aria-label={t("routes.main.favorite_list")}
                      >
                        <img
                          src={locationImage}
                          alt={location.name}
                          width={120}
                          height={80}
                          style={{ width: 120, height: 80, objectFit: "cover", display: "block" }}
                        />
                      </button>
                      <Box
                        className="grow"
                        onMouseEnter={() => setVisibleEditLocationId(location.id)}
                        onMouseLeave={() => setVisibleEditLocationId(null)}
                        onClick={() => setVisibleEditLocationId(location.id)}
                      >
                        <Box className="flex flex-row items-center gap-1">
                          <Typography sx={{ fontSize: "1.35rem", lineHeight: 1.25, fontWeight: 500 }}>{location.name}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => openEditLocation(location)}
                            sx={{ opacity: showEdit ? 1 : 0, transition: "opacity .2s", p: 0.25 }}
                            title={t("general.edit")}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {location.description && <Typography sx={{ color: "text.secondary", m: 0 }}>{location.description}</Typography>}
                        {location.menu_link && (
                          <Link
                            href={location.menu_link}
                            target="_blank"
                            underline="none"
                            sx={{ fontSize: "1rem", color: "primary.main", "&:visited": { color: "primary.main" } }}
                          >
                            {t("general.menucard")}
                          </Link>
                        )}
                        <Box className="sm:hidden mt-1" sx={{ fontSize: "0.78rem" }}>
                          {(location.votes || []).map((voteName: string) => (
                            <Box key={`${location.id}-vote-mobile-${voteName}`} className="leading-4">
                              ⭐ {voteName}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box className="hidden sm:flex flex-col items-end gap-3 min-w-[120px]">
                        <Box sx={{ fontSize: "0.78rem" }} className="flex flex-col items-end">
                          {(location.votes || []).map((voteName: string) => (
                            <Box key={`${location.id}-vote-${voteName}`} className="flex flex-row items-center gap-1 leading-4 justify-end">
                              <Typography sx={{ color: "text.secondary", fontSize: "1em" }}>
                                {voteName}
                              </Typography>
                              <StarIcon sx={{ color: "warning.main", fontSize: "1rem" }} />
                            </Box>
                          ))}
                        </Box>
                        {Boolean((location.votes || []).length) && (
                          hasOrderingInProgress ? (
                            <Button
                              variant="contained"
                              onClick={() => (openOrderSetForLocation ? scrollToOrderSet(openOrderSetForLocation.id) : undefined)}
                              disabled={!openOrderSetForLocation}
                            >
                              {t("components.location.ordering_in_progress")}
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={() => takeOrders(location)}
                              disabled={isCreatingOrderSet}
                            >
                              {t("components.location.placeorder")}
                            </Button>
                          )
                        )}
                      </Box>
                    </Box>
                    <Box className="sm:hidden flex justify-end mt-2">
                      {Boolean((location.votes || []).length) && (
                        hasOrderingInProgress ? (
                          <Button
                            variant="contained"
                            onClick={() => (openOrderSetForLocation ? scrollToOrderSet(openOrderSetForLocation.id) : undefined)}
                            disabled={!openOrderSetForLocation}
                          >
                            {t("components.location.ordering_in_progress")}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => takeOrders(location)}
                            disabled={isCreatingOrderSet}
                          >
                            {t("components.location.placeorder")}
                          </Button>
                        )
                      )}
                    </Box>
                    <Typography sx={{ fontSize: "0.75rem", mt: "0.3em", textAlign: "right", color: "text.secondary" }}>
                      {location.order_count
                        ? t("components.location.order_count", { order_count: location.order_count })
                        : t("components.location.no_order_count")}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box className="flex flex-col gap-4 items-start">
              <Button variant="contained" title={t("routes.main.add_new_location")} onClick={openNewLocation}>
                <AddIcon />
                {(!data?.locations?.length) && <span>&nbsp;{t("components.location_edit.new_location")}</span>}
              </Button>
            </Box>

            {locationEditor && (
              <Card>
                <CardContent className="highlightedCard">
                  <Box className="flex flex-col gap-3">
                    <Typography variant="h6">
                      {locationEditor.id ? t("components.location_edit.edit", { name: locationEditor.name }) : t("components.location_edit.new_location")}
                    </Typography>
                    <TextField
                      name="location-name"
                      variant="standard"
                      label="Name"
                      inputRef={locationNameInputRef}
                      value={locationEditor.name || ""}
                      onChange={(event) => setLocationEditor((previous: any) => ({ ...previous, name: event.target.value }))}
                    />
                    <TextField
                      name="location-description"
                      variant="standard"
                      label={t("components.location_edit.shortdescription")}
                      value={locationEditor.description || ""}
                      onChange={(event) => setLocationEditor((previous: any) => ({ ...previous, description: event.target.value }))}
                    />
                    <TextField
                      name="location-menu-link"
                      variant="standard"
                      label={t("components.location_edit.menu_link")}
                      value={locationEditor.menu_link || ""}
                      onChange={(event) => setLocationEditor((previous: any) => ({ ...previous, menu_link: event.target.value }))}
                    />
                    <TextField
                      name="location-delivery-fee"
                      variant="standard"
                      label={t("general.fee")}
                      type="number"
                      value={locationEditor.delivery_fee || ""}
                      onChange={(event) => setLocationEditor((previous: any) => ({ ...previous, delivery_fee: event.target.value }))}
                    />
                    <Box className="flex flex-col gap-1">
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Image
                      </Typography>
                      {!rawImageSrc && (
                        <button
                          type="button"
                          onClick={openLocationImagePicker}
                          className="border-0 bg-transparent p-0 cursor-pointer w-fit"
                          title="Select image"
                        >
                          <img
                            src={
                              locationEditor.newIcon
                                ? locationEditor.newIcon
                                : locationEditor.icon
                                  ? `${resourcesBaseUrl()}/${locationEditor.icon}.png`
                                  : "/assets/placeholder.jpg"
                            }
                            alt={locationEditor.name || "location-image"}
                            width={120}
                            height={80}
                            style={{ objectFit: "cover" }}
                          />
                        </button>
                      )}
                      <input
                        ref={locationImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onLocationImageChange}
                        style={{ display: "none" }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={openLocationImagePicker}
                        sx={{ alignSelf: "flex-start", minWidth: 0, px: 1, py: 0.25, fontSize: "0.72rem" }}
                      >
                        Browse image…
                      </Button>
                      {rawImageSrc && (
                        <Box className="flex flex-col gap-2">
                          <Box sx={{ position: "relative", width: "100%", height: 280, backgroundColor: "#000" }}>
                            <Cropper
                              image={rawImageSrc}
                              crop={crop}
                              zoom={zoom}
                              aspect={3 / 2}
                              cropShape="rect"
                              showGrid={false}
                              onCropChange={setCrop}
                              onCropComplete={onCropComplete}
                              onZoomChange={setZoom}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Zoom
                          </Typography>
                          <Slider min={1} max={3} step={0.1} value={zoom} onChange={(_, value) => setZoom(value as number)} />
                          <Box className="flex flex-row gap-2">
                            <Button variant="outlined" onClick={applyCroppedImage}>
                              Apply
                            </Button>
                            <Button
                              variant="text"
                              onClick={() => {
                                setRawImageSrc(null);
                                setCrop({ x: 0, y: 0 });
                                setZoom(1);
                                setCroppedAreaPixels(null);
                              }}
                            >
                              {t("general.cancel")}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <Box className="flex flex-row gap-2">
                      <Button variant="contained" disabled={locationProcessing || !locationEditor.name?.trim()} onClick={saveLocation}>
                        {t("general.save")}
                      </Button>
                      <Button variant="outlined" disabled={locationProcessing} onClick={cancelLocationEditor}>
                        {t("general.cancel")}
                      </Button>
                      {locationEditor.id && (
                        <Button color="error" variant="outlined" disabled={locationProcessing} onClick={openDeleteLocationConfirm}>
                          <DeleteIcon />&nbsp;{t("general.delete")}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Box ref={locationEditorScrollAnchorRef} />

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "text.secondary" }}>
                  <InfoIcon />&nbsp;{t("routes.main.hint_title")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "text.secondary" }}>
                  {t("routes.main.hint_1")}
                  {t("routes.main.hint_2")}
                </Typography>
              </AccordionDetails>
            </Accordion>
            </Box>
          </CardContent>
        </Card>

        <Box className="w-full lg:w-[30%]">
          <Card sx={{ backgroundColor: "#fafad2", m: 0 }}>
            <CardContent>
              <Typography variant="h6">{t("components.orderset.chat")}</Typography>
              <Box
                ref={mainChatContainerRef}
                className="max-h-64 overflow-auto my-2 flex flex-col gap-2"
              >
                {(data.chat || []).map((msg: any, index: number) => (
                  <Box key={`main-chat-${index}`}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {msg.name} [{moment(msg.date).fromNow()}]
                    </Typography>
                    <Typography>{msg.msg}</Typography>
                  </Box>
                ))}
              </Box>
              <Box className="flex flex-row items-center gap-2">
                <TextField
                  fullWidth
                  variant="standard"
                  label={t("components.orderset.chat_msg")}
                  value={mainChatInput}
                  onChange={(event) => setMainChatInput(event.target.value)}
                  onKeyDown={(event) => (event.key === "Enter" ? sendMainChat() : undefined)}
                />
                <IconButton onClick={sendMainChat}>
                  <SendIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog
        open={Boolean(pendingOrderSetDeletion)}
        onClose={closeDeleteOrderSetConfirm}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("components.orderset.confirm_deletion_header")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>
            {t("components.orderset.confirm_deletion_question")}
            {pendingOrderSetDeletion?.location?.name || ""}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteOrderSetConfirm}>{t("components.orderset.confirm_deletion_no")}</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteOrderSet}>
            {t("components.orderset.confirm_deletion_yes")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingOrderEntryDeletion)}
        onClose={closeDeleteOrderEntryConfirm}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("components.orderset.confirm_entry_deletion_header")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>
            {t("components.orderset.confirm_entry_deletion_question", { name: pendingOrderEntryDeletion?.entryName || "" })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteOrderEntryConfirm}>{t("general.cancel")}</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteOrderEntry}>
            {t("general.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingLocationDeletion)}
        onClose={closeDeleteLocationConfirm}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("components.location_edit.confirm_deletion_header")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>
            {t("components.location_edit.confirm_deletion_question")}
            {pendingLocationDeletion?.name || ""}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteLocationConfirm}>{t("components.location_edit.confirm_deletion_no")}</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteLocation}>
            {t("components.location_edit.confirm_deletion_yes")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={foregroundPush.open}
        autoHideDuration={7000}
        onClose={() => setForegroundPush((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setForegroundPush((previous) => ({ ...previous, open: false }))}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          <Typography sx={{ fontWeight: 700 }}>{foregroundPush.title}</Typography>
          <Typography variant="body2">{foregroundPush.body}</Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}
