def format_indian_number(value: float) -> str:
    """
    Format a number using the Indian numbering system (e.g., 1,00,000).
    """
    try:
        value = float(value)
    except (ValueError, TypeError):
        return str(value)

    s = f"{abs(value):.2f}"
    is_negative = value < 0
    
    parts = s.split('.')
    integer_part = parts[0]
    decimal_part = parts[1] if len(parts) > 1 else ""

    if len(integer_part) <= 3:
        formatted_int = integer_part
    else:
        last_three = integer_part[-3:]
        rest = integer_part[:-3]
        
        # Group remaining digits in pairs of 2
        groups = []
        while rest:
            groups.append(rest[-2:])
            rest = rest[:-2]
        
        groups.reverse()
        formatted_int = ",".join(groups) + "," + last_three

    result = formatted_int
    # We typically don't show decimals for large currency text unless specified, 
    # but for consistency with standard formatting we might want to drop it if .00
    # However, standard practice often keeps it. Let's decide to drop .00 for cleaner text.
    if decimal_part and int(decimal_part) > 0:
         result += "." + decimal_part
         
    return ("-" if is_negative else "") + result
