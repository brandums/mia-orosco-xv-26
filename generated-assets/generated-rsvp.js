(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setStatus(form, message, isError) {
    var status = form.querySelector(".generated-rsvp-status");
    if (!status) return;
    status.textContent = message || "";
    status.style.color = isError ? "#a33" : "inherit";
  }

  function setButton(form, disabled, text) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = disabled;
    var label = button.querySelector(".elementor-button-text") || button;
    label.textContent = text;
  }

  function fillSelect(select, totalTickets) {
    if (!select) return;
    var tickets = parseInt(totalTickets, 10);
    if (!Number.isFinite(tickets) || tickets < 1) tickets = 1;

    select.innerHTML = "";
    for (var i = tickets; i > 0; i--) {
      var option = document.createElement("option");
      option.value = String(i);
      if (tickets === 1) {
        option.textContent = "Asistiré solo";
      } else if (i === tickets) {
        option.textContent = "Asistiremos los " + i;
      } else if (i === 1) {
        option.textContent = "Asistiré solo";
      } else {
        option.textContent = "Asistiremos solo " + i;
      }
      select.appendChild(option);
    }

    var no = document.createElement("option");
    no.value = "0";
    no.textContent = "No podré asistir";
    select.appendChild(no);
  }

  function applyInvitationStyle(form) {
    var wrapper = form.closest(".generated-rsvp-inline") || form.closest(".generated-rsvp-section") || form;
    var source = findBestStyleSource(wrapper);
    if (!source) return;

    var style = window.getComputedStyle(source);
    /*
    if (style.color && style.color !== "rgba(0, 0, 0, 0)") {
      // wrapper.style.setProperty("--generated-rsvp-accent", style.color);
      // wrapper.style.setProperty("--generated-rsvp-button-bg", style.color);
    }
    */
    /*
    if (style.fontFamily) {
      // wrapper.style.setProperty("--generated-rsvp-font", style.fontFamily);
    }
    */
    if (style.fontSize) {
      wrapper.style.setProperty("--generated-rsvp-base-size", style.fontSize);
    }
  }

  function findBestStyleSource(node) {
    var local = findLocalTextElement(node);
    if (local) return local;

    var previous = findPreviousTextElement(node);
    if (previous) return previous;

    var global = findLastTextElement(document.body);
    return global || null;
  }

  function findLocalTextElement(node) {
    var section = node.closest && node.closest("section,.elementor-section,.elementor-widget-wrap,.elementor-column");
    if (!section) return null;

    var selector = "h1,h2,h3,h4,h5,h6,p,.elementor-heading-title,.elementor-widget-text-editor";
    var nodes = Array.prototype.slice.call(section.querySelectorAll(selector));
    for (var i = 0; i < nodes.length; i++) {
      if (node.contains(nodes[i])) continue;
      var text = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (text && text.length > 2) return nodes[i];
    }

    return null;
  }

  function findPreviousTextElement(node) {
    var current = node;
    while (current && current !== document.body) {
      var previous = current.previousElementSibling;
      while (previous) {
        var found = findLastTextElement(previous);
        if (found) return found;
        previous = previous.previousElementSibling;
      }
      current = current.parentElement;
    }
    return null;
  }

  function findLastTextElement(root) {
    var selector = "h1,h2,h3,h4,h5,h6,p,span,.elementor-heading-title,.elementor-widget-text-editor";
    var nodes = Array.prototype.slice.call(root.querySelectorAll(selector));
    if (root.matches && root.matches(selector)) nodes.unshift(root);

    for (var i = nodes.length - 1; i >= 0; i--) {
      var text = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (text && text.length > 2) return nodes[i];
    }
    return null;
  }

  function toGoogleMapsUrl(raw) {
    var value = (raw || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(value);
  }

  function setupGeneratedMapLinks() {
    var holders = Array.prototype.slice.call(document.querySelectorAll("[data-coords], [data-url]"));
    holders.forEach(function (holder) {
      var raw = holder.getAttribute("data-url") || holder.getAttribute("data-coords") || "";
      var url = toGoogleMapsUrl(raw);
      if (!url) return;

      var targets = holder.matches("a,button,[role='button'],.elementor-button")
        ? [holder]
        : Array.prototype.slice.call(holder.querySelectorAll("a,button,[role='button'],.elementor-button,.btn,.btn-v,.btn-direccion"));

      targets.forEach(function (target) {
        var text = (target.textContent || holder.textContent || "").toLowerCase();
        var looksLikeLocation = text.indexOf("ubic") >= 0 ||
          text.indexOf("direcci") >= 0 ||
          text.indexOf("map") >= 0 ||
          holder.className.toString().toLowerCase().indexOf("map") >= 0 ||
          holder.className.toString().toLowerCase().indexOf("ubic") >= 0 ||
          targets.length === 1;

        if (!looksLikeLocation) return;

        if (target.tagName === "A") {
          target.href = url;
          target.target = "_blank";
          target.rel = "noopener";
        }

        target.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.open(url, "_blank", "noopener");
        }, true);
      });
    });
  }

  function setupGeneratedCountdowns() {
    var timers = [];

    Array.prototype.slice.call(document.querySelectorAll(".elementor-countdown-wrapper[data-date]")).forEach(function (wrapper) {
      var target = parseCountdownDate(wrapper.getAttribute("data-date"));
      if (!target) return;
      revealCountdownBlock(wrapper);

      timers.push({
        target: target,
        days: wrapper.querySelector(".elementor-countdown-days"),
        hours: wrapper.querySelector(".elementor-countdown-hours"),
        minutes: wrapper.querySelector(".elementor-countdown-minutes"),
        seconds: wrapper.querySelector(".elementor-countdown-seconds")
      });
    });

    Array.prototype.slice.call(document.querySelectorAll("[data-date].eael-countdown-items, .eael-countdown-items[data-date]")).forEach(function (wrapper) {
      var target = parseCountdownDate(wrapper.getAttribute("data-date"));
      if (!target) return;
      revealCountdownBlock(wrapper);

      timers.push({
        target: target,
        days: wrapper.querySelector("[data-days], .eael-countdown-days .eael-countdown-digits"),
        hours: wrapper.querySelector("[data-hours], .eael-countdown-hours .eael-countdown-digits"),
        minutes: wrapper.querySelector("[data-minutes], .eael-countdown-minutes .eael-countdown-digits"),
        seconds: wrapper.querySelector("[data-seconds], .eael-countdown-seconds .eael-countdown-digits")
      });
    });

    if (timers.length === 0) return;

    function render() {
      timers.forEach(function (timer) {
        var remaining = Math.max(0, timer.target.getTime() - Date.now());
        var totalSeconds = Math.floor(remaining / 1000);
        var days = Math.floor(totalSeconds / 86400);
        var hours = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        setCountdownText(timer.days, days);
        setCountdownText(timer.hours, hours);
        setCountdownText(timer.minutes, minutes);
        setCountdownText(timer.seconds, seconds);
      });
    }

    render();
    window.setInterval(render, 1000);
  }

  function revealCountdownBlock(wrapper) {
    var widget = wrapper.closest(".elementor-widget-countdown, .eael-countdown-wrapper, .elementor-widget") || wrapper;
    revealNode(widget);

    var previous = widget.previousElementSibling;
    while (previous && previous.matches && previous.matches(".elementor-widget-spacer, .elementor-element:empty")) {
      previous = previous.previousElementSibling;
    }
    if (previous && /faltan/i.test(previous.textContent || "")) {
      revealNode(previous);
    }

    var parent = widget.parentElement;
    for (var i = 0; parent && i < 4; i++) {
      if (parent.classList && parent.classList.contains("zoom-animar")) {
        revealNode(parent);
      }
      parent = parent.parentElement;
    }
  }

  function revealNode(node) {
    if (!node) return;
    node.classList.add("generated-countdown-visible", "zoom-in");
    node.classList.remove("zoom-out", "elementor-invisible");
    node.style.opacity = "1";
    node.style.visibility = "visible";
    node.style.transform = "none";
  }

  function parseCountdownDate(value) {
    value = (value || "").trim();
    if (!value) return null;

    if (/^\d+$/.test(value)) {
      var numeric = parseInt(value, 10);
      return new Date(value.length <= 10 ? numeric * 1000 : numeric);
    }

    var parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function setCountdownText(node, value) {
    if (!node) return;
    node.textContent = String(Math.max(0, value)).padStart(2, "0");
  }

  ready(function () {
    setupGeneratedMapLinks();
    setupGeneratedCountdowns();

    var form = document.getElementById("guest-rsvp-form");
    if (!form) return;
    var nameInput = document.getElementById("form-field-nombre");
    if (nameInput) nameInput.readOnly = true;

    if (form.dataset.generatedRsvpBound === "1") return;
    form.dataset.generatedRsvpBound = "1";
    applyInvitationStyle(form);

    var params = new URLSearchParams(window.location.search);
    var token = params.get("token") || "";
    var apiBase = (window.INVITATION_API_BASE_URL || "").replace(/\/+$/, "");
    var nameDisplay = document.getElementById("guest-name-display");
    var ticketsDisplay = document.getElementById("guest-tickets-display");
    var attendanceSelect = document.getElementById("form-field-asistencia");

    async function loadGuest() {
      if (!token) {
        if (nameDisplay) nameDisplay.textContent = "Invitado Genérico";
        if (ticketsDisplay) ticketsDisplay.textContent = "0";
        if (nameInput) nameInput.value = "Invitado Genérico";
        if (nameInput) nameInput.readOnly = true;
        fillSelect(attendanceSelect, 1);
        setStatus(form, "", false);
        return;
      }

      if (!apiBase) {
        if (nameInput) nameInput.value = "Invitado Genérico";
        if (nameInput) nameInput.readOnly = true;
        fillSelect(attendanceSelect, 1);
        setStatus(form, "Configura la URL de la API para activar las confirmaciones.", true);
        return;
      }

      try {
        var response = await fetch(apiBase + "/invitado?token=" + encodeURIComponent(token));
        if (!response.ok) throw new Error("No se pudo cargar el invitado.");
        var guest = await response.json();

        var guestName = guest["Nombre(s)"] || guest.nombre || guest.name || "Invitado de Honor";
        var tickets = guest.Tickets || guest.tickets || guest.pases || 1;

        if (nameDisplay) nameDisplay.textContent = guestName;
        if (ticketsDisplay) ticketsDisplay.textContent = tickets;
        if (nameInput) nameInput.value = guestName;
        if (nameInput) nameInput.readOnly = true;

        if (guest.TicketsConfirmados > 0 || guest.RespondioFormulario || guest.respondioFormulario) {
          form.innerHTML = "<h3 class='generated-rsvp-thanks'>Ya has respondido a esta invitación. ¡Gracias!</h3>";
          return;
        }

        fillSelect(attendanceSelect, tickets);
        setStatus(form, "", false);
      } catch (error) {
        console.error("Error cargando invitado:", error);
        if (nameInput) nameInput.value = "Invitado Genérico";
        if (nameInput) nameInput.readOnly = true;
        fillSelect(attendanceSelect, 1);
        setStatus(form, "No se pudo cargar el invitado. Revisa la API o el token.", true);
      }
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!token) {
        setStatus(form, "", false);
        return;
      }

      if (!apiBase) {
        setStatus(form, "Configura la URL de la API antes de confirmar.", true);
        return;
      }

      setButton(form, true, "Enviando...");
      setStatus(form, "", false);

      var data = new FormData(form);
      var payload = {
        token: token,
        asistencia: data.get("form_fields[asistencia]"),
        mensaje: data.get("form_fields[mensaje]") || ""
      };

      try {
        var response = await fetch(apiBase + "/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("No se pudo guardar la confirmación.");
        form.innerHTML = "<h3 class='generated-rsvp-thanks'>¡Gracias por confirmar tu asistencia! Hemos registrado tus datos.</h3>";
      } catch (error) {
        console.error("Error enviando RSVP:", error);
        setButton(form, false, "Enviar");
        setStatus(form, "Hubo un problema guardando tu confirmación. Intenta más tarde.", true);
      }
    }, true);

    loadGuest();
  });
})();