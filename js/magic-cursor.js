(function () {
  "use strict";

  class SquishDotFollower {
    constructor(dotElement) {
      this.dot = dotElement;

      // Position tracking
      this.position = {
        current: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        previous: { x: 0, y: 0 },
      };

      // Velocity for squish calculation
      this.velocity = { x: 0, y: 0 };
      this.smoothingFactor = 0.12;
      this.isVisible = false;

      // Squish properties
      this.squish = {
        x: 1,
        y: 1,
        targetX: 1,
        targetY: 1,
        enabled: true,
      };

      // Current state
      this.currentState = null;

      this.setupListeners();
      this.startAnimationLoop();
    }

    setupListeners() {
      // Track mouse position
      window.addEventListener("pointermove", (event) => {
        this.position.target.x = event.clientX;
        this.position.target.y = event.clientY;

        if (!this.isVisible) {
          this.position.current.x = event.clientX;
          this.position.current.y = event.clientY;
          this.position.previous.x = event.clientX;
          this.position.previous.y = event.clientY;
          this.isVisible = true;
        }
      });

      // Custom cursor state hover listeners
      document.querySelectorAll("[data-cursor-state]").forEach((element) => {
        const state = element.getAttribute("data-cursor-state");

        element.addEventListener("pointerenter", () => {
          this.activateImageState(state);
        });

        element.addEventListener("pointerleave", () => {
          this.deactivateImageState();
        });
      });

      // Hide dot over interactive elements
      document.querySelectorAll("a, button, .theme-switcher").forEach((el) => {
        el.addEventListener("pointerenter", () => {
          this.dot.classList.add("dot-hidden");
        });
        el.addEventListener("pointerleave", () => {
          this.dot.classList.remove("dot-hidden");
        });
      });
    }

    activateImageState(state) {
      this.currentState = state;
      this.squish.enabled = false;

      // Remove specific state classes
      document.body.classList.remove(
        "dot-view-image",
        "dot-drag-view",
        "dot-slide",
        "dot-heading",
      );

      // Add appropriate class and text
      switch (state) {
        case "view-image":
          document.body.classList.add("dot-view-image");
          this.dot.textContent = "View Image";
          break;
        case "drag-view":
          document.body.classList.add("dot-drag-view");
          this.dot.textContent = "Drag to View";
          break;
        case "slide":
          document.body.classList.add("dot-slide");
          this.dot.textContent = "Drag";
          break;
      }
    }

    deactivateImageState() {
      this.currentState = null;
      this.squish.enabled = true;
      this.dot.textContent = "";

      // Remove specific state classes
      document.body.classList.remove(
        "dot-view-image",
        "dot-drag-view",
        "dot-slide",
        "dot-heading",
      );
    }

    calculateVelocity() {
      this.velocity.x = this.position.current.x - this.position.previous.x;
      this.velocity.y = this.position.current.y - this.position.previous.y;

      // Store current as previous for next frame
      this.position.previous.x = this.position.current.x;
      this.position.previous.y = this.position.current.y;
    }

    calculateSquish() {
      if (!this.squish.enabled) {
        // Reset squish when disabled
        this.squish.targetX = 1;
        this.squish.targetY = 1;
        return;
      }

      // Calculate speed
      const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

      // Squish amount based on speed
      const squishAmount = Math.min(speed * 0.08, 3);

      if (speed > 0.5) {
        // Calculate angle of movement
        const angle = Math.atan2(this.velocity.y, this.velocity.x);

        // Squish perpendicular to movement direction
        const squishX = 1 + squishAmount * Math.abs(Math.sin(angle));
        const squishY = 1 + squishAmount * Math.abs(Math.cos(angle));

        this.squish.targetX = squishX;
        this.squish.targetY = squishY;
      } else {
        // Return to circle when slow/stopped
        this.squish.targetX = 1;
        this.squish.targetY = 1;
      }
    }

    interpolate(current, target, factor) {
      return current + (target - current) * factor;
    }

    updatePosition() {
      // Smooth interpolation towards target
      this.position.current.x = this.interpolate(
        this.position.current.x,
        this.position.target.x,
        this.smoothingFactor,
      );

      this.position.current.y = this.interpolate(
        this.position.current.y,
        this.position.target.y,
        this.smoothingFactor,
      );

      // Calculate velocity for squish
      this.calculateVelocity();

      // Update squish values
      this.calculateSquish();

      // Smooth squish interpolation
      this.squish.x = this.interpolate(this.squish.x, this.squish.targetX, 0.15);
      this.squish.y = this.interpolate(this.squish.y, this.squish.targetY, 0.15);

      // Apply transform with squish
      const scaleX = 1 / this.squish.x;
      const scaleY = 1 / this.squish.y;

      this.dot.style.left = `${this.position.current.x}px`;
      this.dot.style.top = `${this.position.current.y}px`;
      this.dot.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
    }

    startAnimationLoop() {
      const loop = () => {
        this.updatePosition();
        requestAnimationFrame(loop);
      };

      loop();
    }
  }

  // Initialize the squish dot follower
  const dotElement = document.querySelector(".follow-dot");
  const isMobileCursorDisabled = window.matchMedia(
    "(max-width: 991.98px), (hover: none), (pointer: coarse)",
  ).matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (dotElement && !isMobileCursorDisabled && !prefersReducedMotion) {
    new SquishDotFollower(dotElement);
  } else if (dotElement) {
    dotElement.style.display = "none";
  }

  // Add click feedback to cards (no cursor change)
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", function () {
      this.style.transform = "scale(0.95) translateY(-10px)";
      setTimeout(() => {
        this.style.transform = "";
      }, 200);
    });
  });
})();
