/*
 * Notification & ManageNotifications classes
 *
 * My Notification class handles rendering a single toast styled notification
 * alert which have a slide-in animation mostly appearing centered at the top
 * or bottom of the canvas. It also utilises the Jarvis-inspired glassmorphism
 * styling, with a smooth timed fade-out.
 *
 * ManageNotifications holds and manages the active notification queue,  with
 * the various updates and the logic for drawing them each frame, as well as
 * removing expired/timed-out ones automatically.
 *
 * Brayden Hoyle | n11967340
 */

class Notification {
  constructor(message, severity, position) {
    this.message = message;
    this.severity = severity;
    this.position = position;

    this.lifespan = 180; // 220
    this.fadeFrames = 20; // 60
    this.age = 0;

    this.slideProgress = 0;
    this.slideSpeed = 0.12;

    this.notificationWidth = 310;
    this.notificationHeight = 60;
    this.cornerRadius = 10;

    switch (this.severity) {
      case "success":
        this.accentColour = [80, 200, 155];
        this.iconLabel = "✓";
        break;
      case "warning":
        this.accentColour = [220, 170, 80];
        this.iconLabel = "!";
        break;
      case "error":
        this.accentColour = [210, 90, 100];
        this.iconLabel = "✕";
        break;
      default:
        this.accentColour = [140, 170, 225];
        this.iconLabel = "i";
        break;
    }
  }

  isExpired() {
    return this.age >= this.lifespan + this.fadeFrames;
  }

  /* This function calculates the current opacity for this notification based on its age. It returns 255 (full opacity) while within the lifespan, then linearly fades to 0 over the course of the fadeFrames period.
   */
  getnotificationOpacity() {
    if (this.age < this.lifespan) {
      return 255;
    }

    return map(
      this.age,
      this.lifespan,
      this.lifespan + this.fadeFrames,
      255,
      0
    );
  }

  getTargetY() {
    if (this.position === "top") {
      return 30;
    }

    return height - this.notificationHeight - 24;
  }

  getTargetX() {
    if (this.position === "bottom-right") {
      return width - this.notificationWidth - 24;
    }

    let canvasMidX = sidebarWidth + (width - sidebarWidth) / 2;
    return canvasMidX - this.notificationWidth / 2;
  }

  getSlideOffset() {
    let slideDistance = 24;

    if (this.position === "top") {
      return map(this.slideProgress, 0, 1, -slideDistance, 0);
    }

    return map(this.slideProgress, 0, 1, slideDistance, 0);
  }

  update() {
    this.age++;
    this.slideProgress = min(1, this.slideProgress + this.slideSpeed);
  }

  draw(stackOffset) {
    let notificationOpacity = this.getnotificationOpacity();

    if (notificationOpacity <= 0) {
      return;
    }

    let drawX = this.getTargetX();
    let drawY = this.getTargetY() + this.getSlideOffset() + stackOffset;

    let accentR = this.accentColour[0];
    let accentG = this.accentColour[1];
    let accentB = this.accentColour[2];

    let opacityNorm = notificationOpacity / 255;

    push();
    drawingContext.save();

    // Accent glow shadow
    drawingContext.shadowBlur = 18 * opacityNorm;
    drawingContext.shadowColor = `rgba(${accentR},${accentG},${accentB},${
      0.25 * opacityNorm
    })`;
    noFill();
    noStroke();
    rect(
      drawX,
      drawY,
      this.notificationWidth,
      this.notificationHeight,
      this.cornerRadius
    );

    drawingContext.shadowBlur = 0;
    drawingContext.shadowColor = "rgba(0,0,0,0)";

    // Glassmorphism
    drawingContext.filter = "blur(8px)";
    noStroke();
    fill(0, 130, 210, 28 * opacityNorm);
    rect(
      drawX,
      drawY,
      this.notificationWidth,
      this.notificationHeight,
      this.cornerRadius
    );
    drawingContext.filter = "none";

    noStroke();
    fill(0, 80, 160, 22 * opacityNorm);
    rect(
      drawX,
      drawY,
      this.notificationWidth,
      this.notificationHeight,
      this.cornerRadius
    );

    // Inner highlight
    noStroke();
    fill(accentR, accentG, accentB, 28 * opacityNorm);
    rect(
      drawX,
      drawY,
      this.notificationWidth,
      this.notificationHeight,
      this.cornerRadius
    );

    // Cyan border
    noFill();
    stroke(0, 150, 255, 55 * opacityNorm);
    strokeWeight(1);
    rect(
      drawX,
      drawY,
      this.notificationWidth,
      this.notificationHeight,
      this.cornerRadius
    );

    // Top inner highlight line
    stroke(100, 230, 255, 28 * opacityNorm);
    strokeWeight(0.5);
    line(
      drawX + this.cornerRadius,
      drawY + 1,
      drawX + this.notificationWidth - this.cornerRadius,
      drawY + 1
    );

    // Corner braces
    let bl = 8; // brace length
    let bp = 3; // brace pad
    let x1 = drawX - bp;
    let y1 = drawY - bp;
    let x2 = drawX + this.notificationWidth + bp;
    let y2 = drawY + this.notificationHeight + bp;

    stroke(accentR, accentG, accentB, 80 * opacityNorm);
    strokeWeight(1.5);
    noFill();

    // Top left
    line(x1, y1 + bl, x1, y1);
    line(x1, y1, x1 + bl, y1);

    // Top right
    line(x2 - bl, y1, x2, y1);
    line(x2, y1, x2, y1 + bl);

    // Bottom left
    line(x1, y2 - bl, x1, y2);
    line(x1, y2, x1 + bl, y2);

    // Bottom right
    line(x2 - bl, y2, x2, y2);
    line(x2, y2 - bl, x2, y2);

    // Icon circle
    let iconX = drawX + 20;
    let iconY = drawY + this.notificationHeight / 2;

    noStroke();
    fill(accentR, accentG, accentB, notificationOpacity * 0.15);
    circle(iconX, iconY, 22);

    fill(accentR, accentG, accentB, notificationOpacity * 0.95);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(11);
    text(this.iconLabel, iconX, iconY + 1);

    // Message text
    fill(
      isDarkMode
        ? [210, 220, 245, notificationOpacity]
        : [30, 35, 55, notificationOpacity]
    );
    noStroke();
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(13);
    text(this.message, drawX + 45, iconY, this.notificationWidth - 52);

    drawingContext.restore();
    pop();
  }
}

class ManageNotifications {
  constructor() {
    this.activeNotifications = [];
    this.stackSpacing = this.activeNotifications.length > 0 ? 0 : 0;
  }

  /* Adds a new notification to the notification queue, then speeds up the fade-out of any older currently visible notifications so they don't excessively stack visually.
   */
  add(message, severity = "info", position = "bottom") {
    for (let notif of this.activeNotifications) {
      if (notif.age < notif.lifespan) {
        notif.lifespan = max(notif.age + 15, notif.lifespan - 80);
      }
    }

    this.activeNotifications.push(
      new Notification(message, severity, position)
    );
  }

  update() {
    for (let notification of this.activeNotifications) {
      notification.update();
    }

    // ABSOLUTELY DESTROY expired notifications
    this.activeNotifications = this.activeNotifications.filter(
      (notification) => !notification.isExpired()
    );
  }

  draw() {
    // Group by position for stacking
    let notificationGroups = {};
    for (let notification of this.activeNotifications) {
      if (!notificationGroups[notification.position])
        notificationGroups[notification.position] = [];
      notificationGroups[notification.position].push(notification);
    }

    for (let position in notificationGroups) {
      let notificationGroup = notificationGroups[position];

      for (let i = 0; i < notificationGroup.length; i++) {
        // Make newer notifications push older ones further from the edge
        let direction = position === "top" ? -1 : 1;
        let stackOffset = i * this.stackSpacing * direction;
        notificationGroup[i].draw(stackOffset);
      }
    }
  }
}
