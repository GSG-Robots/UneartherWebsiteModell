window.addEventListener("DOMContentLoaded", () => {
    let expanded = false;
    const toggleSidebar = () => {
        expanded = !expanded;
        document.getElementsByTagName("nav")[0].className = expanded ? "expanded" : "";
        document.getElementById("menu-button").className = expanded ? "menu-item hidden" : "menu-item";
        document.getElementById("menu-expand-button").getElementsByTagName("img")[0].src = expanded ? "/icons/chevron-left.svg" : "/icons/chevron-right.svg"
    };
    document.getElementById("menu-expand-button").addEventListener("click", toggleSidebar);
    document.getElementById("menu-button").addEventListener("click", toggleSidebar);
});
