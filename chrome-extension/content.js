// Function to apply styles to buttons and inner spans
function styleButtons() {
  let buttons = document.querySelectorAll(
    "#add-to-cart-button, #buy-now-button, .a-button-primary, [name='submit.addToCart'], [name='submit.add-to-cart']"
  );

  console.log("Buttons found:", buttons.length); // Log the number of buttons found

  buttons.forEach((button) => {
    button.style.padding = "15px 30px";
    button.style.borderRadius = "10px";
    console.log("Styled button:", button); // Log the styled button
  });

  let addToCartTextElements = document.querySelectorAll(".a-button-text");

  addToCartTextElements.forEach((element) => {
    if (element.textContent.trim().toLowerCase() === "add to cart") {
      element.style.fontSize = "20px";
      console.log("Styled a-button-text element:", element); // Log the styled text element
    }
  });

  if (buttons.length === 0 && addToCartTextElements.length === 0) {
    console.log(
      "No buttons or text elements found with the specified selectors."
    );
  }
  /*
  let sideBar = document.getElementById("s-refinements");
  sideBar.style.boxShadow = "0px 0px 7px 5px rgba(52,194,199,1)";
  sideBar.style.padding = "10px";*/
}

// // Run the function on DOMContentLoaded
// document.addEventListener("DOMContentLoaded", styleButtons);

// // Use MutationObserver to detect changes in the DOM and apply styles dynamically
// const observer = new MutationObserver(styleButtons);
// if (document.body == null) {
//   console.log("body is null");
// } else {
//   observer.observe(document.body, { childList: true, subtree: true });
// }

// SIDEBAR BLUR
function styleSideBar() {
  let sidebar = document.querySelectorAll(
    ".a-section, .a-declarative, .a-unordered-list.a-nostyle.a-vertical.a-spacing-medium, .a-section.a-spacing-small, #topRefinements, #s-refinements, .s-widget-container.s-spacing-medium.s-widget-container-height-medium.celwidget[slot='LEFT'][template='REFINEMENTS'][widgetId='refinements']"
  );

  console.log("SIDEBAR found:", sidebar.length); // Log the number of sidebars found

  sidebar.forEach((side) => {
    side.style.filter = "blur(5px)"; // Apply the blur effect
    console.log("Styled SIDEBAR:", side); // Log the styled sidebar
  });

  if (sidebar.length === 0) {
    console.log("No sidebar elements found with the specified selectors.");
  }
}


// // Run the function on DOMContentLoaded
// document.addEventListener("DOMContentLoaded", styleButtons);

// // Use MutationObserver to detect changes in the DOM and apply styles dynamically
// const observer = new MutationObserver(styleButtons);
// if (document.body == null) {
//   console.log("body is null");
// } else {
//   observer.observe(document.body, { childList: true, subtree: true });
// }

// Run the functions on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  styleButtons();
  styleSideBar();
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    styleSideBar();
  }, 1000); // Adjust the delay as needed
});


// Use MutationObserver to detect changes in the DOM and apply styles dynamically
const observer = new MutationObserver(() => {
  styleButtons();
  styleSideBar();
});

if (document.body != null) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  console.log("body is null");
}




// const toBlur = [".a-section", ".a-declarative", "a-unordered-list a-nostyle a-vertical a-spacing-medium", "a-section a-spacing-small", "#topRefinements/0", "#s-refinements", "s-widget-container s-spacing-medium s-widget-container-height-medium celwidget slot=LEFT template=REFINEMENTS widgetId=refinements"];
// function applyBlurToSidebar() {
//   const sidebar = document.querySelector(sidebarSelector);
//   if (sidebar) {
//     sidebar.style.filter = "blur(5px)"; // Adjust blur intensity as needed
//   }
// }

// // Execute the blur function when the page loads
// window.addEventListener("load", applyBlur);

